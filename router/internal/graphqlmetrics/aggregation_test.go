package graphqlmetrics

import (
	"github.com/stretchr/testify/require"
	graphqlmetricsv1 "github.com/wundergraph/cosmo/router/gen/proto/wg/cosmo/graphqlmetrics/v1"
	"testing"
)

func TestAggregateCountWithEqualUsages(t *testing.T) {

	result := Aggregate([]*graphqlmetricsv1.SchemaUsageInfo{
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     2,
				},
				{
					Path:      []string{"user", "name"},
					TypeNames: []string{"User", "String"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
				{
					Path:      []string{"user", "name"},
					TypeNames: []string{"User", "String"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
	})

	require.Equal(t, 1, len(result))
	require.Equal(t, uint64(3), result[0].TypeFieldMetrics[0].Count)
	require.Equal(t, uint64(2), result[0].TypeFieldMetrics[1].Count)
}

func TestAggregateWithDifferentOperationInfo(t *testing.T) {

	result := Aggregate([]*graphqlmetricsv1.SchemaUsageInfo{
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     2,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123456", // different hash
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
	})

	require.Equal(t, 2, len(result))
	require.Equal(t, uint64(2), result[0].TypeFieldMetrics[0].Count)
	require.Equal(t, uint64(1), result[1].TypeFieldMetrics[0].Count)
}

func TestAggregateWithDifferentClientInfo(t *testing.T) {

	result := Aggregate([]*graphqlmetricsv1.SchemaUsageInfo{
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     2,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.1", // different client version
			},
			Attributes: map[string]string{},
		},
	})

	require.Equal(t, 2, len(result))
	require.Equal(t, uint64(2), result[0].TypeFieldMetrics[0].Count)
	require.Equal(t, uint64(1), result[1].TypeFieldMetrics[0].Count)
}

func TestAggregateWithDifferentHash(t *testing.T) {

	result := Aggregate([]*graphqlmetricsv1.SchemaUsageInfo{
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     2,
				},
				{
					Path:      []string{"user", "name"},
					TypeNames: []string{"User", "String"},
					SourceIDs: []string{"1", "2"},
					Count:     6,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123456", // emulate different hash because of different fields
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
		{
			TypeFieldMetrics: []*graphqlmetricsv1.TypeFieldUsageInfo{
				{
					Path:      []string{"user", "id"},
					TypeNames: []string{"User", "ID"},
					SourceIDs: []string{"1", "2"},
					Count:     1,
				},
			},
			OperationInfo: &graphqlmetricsv1.OperationInfo{
				Type: graphqlmetricsv1.OperationType_QUERY,
				Hash: "123",
				Name: "user",
			},
			SchemaInfo: &graphqlmetricsv1.SchemaInfo{
				Version: "1",
			},
			ClientInfo: &graphqlmetricsv1.ClientInfo{
				Name:    "wundergraph",
				Version: "1.0.0",
			},
			Attributes: map[string]string{},
		},
	})

	require.Equal(t, 2, len(result))
	require.Equal(t, uint64(2), result[0].TypeFieldMetrics[0].Count)
	require.Equal(t, uint64(6), result[0].TypeFieldMetrics[1].Count)
	require.Equal(t, uint64(1), result[1].TypeFieldMetrics[0].Count)
}
