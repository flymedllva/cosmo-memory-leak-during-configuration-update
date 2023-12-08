package core

import (
	"connectrpc.com/connect"
	"context"
	"errors"
	"github.com/ClickHouse/clickhouse-go/v2"
	lru "github.com/hashicorp/golang-lru/v2"
	"github.com/sourcegraph/conc/pool"
	graphqlmetricsv1 "github.com/wundergraph/cosmo/graphqlmetrics/gen/proto/wg/cosmo/graphqlmetrics/v1"
	"go.uber.org/zap"
	"sort"
	"strconv"
	"strings"
	"time"
)

var (
	errNotAuthenticated     = errors.New("authentication didn't succeed")
	errMetricWriteFailed    = errors.New("failed to write metrics")
	errOperationWriteFailed = errors.New("operation write failed")
)

type MetricsService struct {
	logger *zap.Logger

	// conn is the clickhouse connection
	conn clickhouse.Conn

	// opGuardCache is used to prevent duplicate writes of the same operation
	opGuardCache *lru.Cache[string, struct{}]
}

// NewMetricsService creates a new metrics service
func NewMetricsService(logger *zap.Logger, chConn clickhouse.Conn) *MetricsService {
	c, err := lru.New[string, struct{}](25000)
	if err != nil {
		panic(err)
	}
	return &MetricsService{
		logger:       logger,
		conn:         chConn,
		opGuardCache: c,
	}
}

// saveOperations saves the operation documents to the storage in a batch
// TODO: Move to async inserts as soon as clickhouse 23.10 is released on cloud
func (s *MetricsService) saveOperations(ctx context.Context, insertTime time.Time, schemaUsage []*graphqlmetricsv1.SchemaUsageInfo) (int, error) {
	opBatch, err := s.conn.PrepareBatch(ctx, `INSERT INTO gql_metrics_operations`)
	if err != nil {
		s.logger.Error("Failed to prepare batch for operations", zap.Error(err))
		return 0, errOperationWriteFailed
	}

	for _, schemaUsage := range schemaUsage {

		operationType := strings.ToLower(schemaUsage.OperationInfo.Type.String())

		// If the operation is already in the cache, we can skip it and don't write it again
		if _, ok := s.opGuardCache.Get(schemaUsage.OperationInfo.Hash); !ok {
			err := opBatch.Append(
				insertTime,
				schemaUsage.OperationInfo.Name,
				schemaUsage.OperationInfo.Hash,
				operationType,
				schemaUsage.RequestDocument,
			)
			if err != nil {
				s.logger.Error("Failed to append operation to batch", zap.Error(err))
				return 0, errOperationWriteFailed
			}
		}

	}

	if err := opBatch.Send(); err != nil {
		s.logger.Error("Failed to send operation batch", zap.Error(err))
		return 0, errOperationWriteFailed
	}

	for _, su := range schemaUsage {
		// Add the operation to the cache once it has been written
		s.opGuardCache.Add(su.OperationInfo.Hash, struct{}{})
	}

	return opBatch.Rows(), nil
}

// saveUsageMetrics saves the usage metrics to the storage in a batch
// TODO: Move to async inserts as soon as clickhouse 23.10 is released on cloud
func (s *MetricsService) saveUsageMetrics(ctx context.Context, insertTime time.Time, claims *GraphAPITokenClaims, schemaUsage []*graphqlmetricsv1.SchemaUsageInfo) (int, error) {
	metricBatch, err := s.conn.PrepareBatch(ctx, `INSERT INTO gql_metrics_schema_usage`)
	if err != nil {
		s.logger.Error("Failed to prepare batch for metrics", zap.Error(err))
		return 0, errMetricWriteFailed
	}

	for _, schemaUsage := range schemaUsage {

		operationType := strings.ToLower(schemaUsage.OperationInfo.Type.String())

		for _, fieldUsage := range schemaUsage.TypeFieldMetrics {

			// Sort stable for fields where the order doesn't matter
			// This reduce cardinality and improves compression

			sort.SliceStable(fieldUsage.SubgraphIDs, func(i, j int) bool {
				return fieldUsage.SubgraphIDs[i] < fieldUsage.SubgraphIDs[j]
			})
			sort.SliceStable(fieldUsage.TypeNames, func(i, j int) bool {
				return fieldUsage.TypeNames[i] < fieldUsage.TypeNames[j]
			})

			err := metricBatch.Append(
				insertTime,
				claims.OrganizationID,
				claims.FederatedGraphID,
				schemaUsage.SchemaInfo.Version,
				schemaUsage.OperationInfo.Hash,
				schemaUsage.OperationInfo.Name,
				operationType,
				fieldUsage.Count,
				fieldUsage.Path,
				fieldUsage.TypeNames,
				fieldUsage.NamedType,
				schemaUsage.ClientInfo.Name,
				schemaUsage.ClientInfo.Version,
				strconv.FormatInt(int64(schemaUsage.RequestInfo.StatusCode), 10),
				schemaUsage.RequestInfo.Error,
				fieldUsage.SubgraphIDs,
				false,
				false,
				schemaUsage.Attributes,
			)
			if err != nil {
				s.logger.Error("Failed to append field metric to batch", zap.Error(err))
				return 0, errMetricWriteFailed
			}
		}

		for _, argumentUsage := range schemaUsage.ArgumentMetrics {

			err := metricBatch.Append(
				insertTime,
				claims.OrganizationID,
				claims.FederatedGraphID,
				schemaUsage.SchemaInfo.Version,
				schemaUsage.OperationInfo.Hash,
				schemaUsage.OperationInfo.Name,
				operationType,
				argumentUsage.Count,
				argumentUsage.Path,
				[]string{argumentUsage.TypeName},
				argumentUsage.NamedType,
				schemaUsage.ClientInfo.Name,
				schemaUsage.ClientInfo.Version,
				strconv.FormatInt(int64(schemaUsage.RequestInfo.StatusCode), 10),
				schemaUsage.RequestInfo.Error,
				[]string{},
				true,
				false,
				schemaUsage.Attributes,
			)
			if err != nil {
				s.logger.Error("Failed to append argument metric to batch", zap.Error(err))
				return 0, errMetricWriteFailed
			}
		}

		for _, inputUsage := range schemaUsage.InputMetrics {

			err := metricBatch.Append(
				insertTime,
				claims.OrganizationID,
				claims.FederatedGraphID,
				schemaUsage.SchemaInfo.Version,
				schemaUsage.OperationInfo.Hash,
				schemaUsage.OperationInfo.Name,
				operationType,
				inputUsage.Count,
				inputUsage.Path,
				[]string{inputUsage.TypeName},
				inputUsage.NamedType,
				schemaUsage.ClientInfo.Name,
				schemaUsage.ClientInfo.Version,
				strconv.FormatInt(int64(schemaUsage.RequestInfo.StatusCode), 10),
				schemaUsage.RequestInfo.Error,
				[]string{},
				false,
				true,
				schemaUsage.Attributes,
			)
			if err != nil {
				s.logger.Error("Failed to append input metric to batch", zap.Error(err))
				return 0, errMetricWriteFailed
			}
		}
	}

	if err := metricBatch.Send(); err != nil {
		s.logger.Error("Failed to send metrics batch", zap.Error(err))
		return 0, errOperationWriteFailed
	}

	return metricBatch.Rows(), nil
}

func (s *MetricsService) PublishGraphQLMetrics(
	ctx context.Context,
	req *connect.Request[graphqlmetricsv1.PublishGraphQLRequestMetricsRequest],
) (*connect.Response[graphqlmetricsv1.PublishOperationCoverageReportResponse], error) {
	res := connect.NewResponse(&graphqlmetricsv1.PublishOperationCoverageReportResponse{})

	claims, err := getClaims(ctx)
	if err != nil {
		return nil, errNotAuthenticated
	}

	var sentMetrics, sentOps = 0, 0
	insertTime := time.Now()

	defer func() {
		s.logger.Debug("metric write finished",
			zap.Duration("duration", time.Since(insertTime)),
			zap.Int("metrics", sentMetrics),
			zap.Int("operations", sentOps),
		)
	}()

	p := pool.New().WithErrors().WithContext(ctx)

	p.Go(func(ctx context.Context) error {
		writtenOps, err := s.saveOperations(ctx, insertTime, req.Msg.SchemaUsage)
		if err != nil {
			return err
		}
		sentOps += writtenOps
		return nil
	})

	p.Go(func(ctx context.Context) error {
		writtenMetrics, err := s.saveUsageMetrics(ctx, insertTime, claims, req.Msg.SchemaUsage)
		if err != nil {
			return err
		}
		sentMetrics += writtenMetrics
		return nil
	})

	if err := p.Wait(); err != nil {
		return nil, err
	}

	return res, nil
}