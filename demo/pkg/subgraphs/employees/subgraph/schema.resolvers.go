package subgraph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.
// Code generated by github.com/99designs/gqlgen version v0.17.39

import (
	"context"
	"time"

	"github.com/wundergraph/cosmo/demo/pkg/subgraphs/employees/subgraph/generated"
	"github.com/wundergraph/cosmo/demo/pkg/subgraphs/employees/subgraph/model"
)

// UpdateEmployeeTag is the resolver for the updateEmployeeTag field.
func (r *mutationResolver) UpdateEmployeeTag(ctx context.Context, id int, tag string) (*model.Employee, error) {
	if id < 1 {
		return nil, nil
	}
	r.mux.Lock()
	defer r.mux.Unlock()
	for _, employee := range employees {
		if id == employee.ID {
			details := &model.Details{}
			if employee.Details != nil {
				details.Forename = employee.Details.Forename
				details.Surname = employee.Details.Surname
				details.Location = employee.Details.Location
			}
			return &model.Employee{
				ID:      employee.ID,
				Details: details,
				Tag:     tag,
				Role:    employee.Role,
				Notes:   employee.Notes,
			}, nil
		}
	}
	return nil, nil
}

// Employee is the resolver for the employee field.
func (r *queryResolver) Employee(ctx context.Context, id int) (*model.Employee, error) {
	r.mux.Lock()
	defer r.mux.Unlock()
	if id < 1 {
		return nil, nil
	}
	for _, employee := range employees {
		if id == employee.ID {
			return &model.Employee{
				ID: employee.ID,
				Details: &model.Details{
					Forename: employee.Details.Forename,
					Surname:  employee.Details.Surname,
					Location: employee.Details.Location,
				},
				UpdatedAt: time.Now().String(),
				Tag:       employee.Tag,
				Role:      employee.Role,
				Notes:     employee.Notes,
			}, nil
		}
	}
	return nil, nil
}

// Employees is the resolver for the employees field.
func (r *queryResolver) Employees(ctx context.Context) ([]*model.Employee, error) {
	r.mux.Lock()
	defer r.mux.Unlock()

	out := make([]*model.Employee, len(employees))
	for i, employee := range employees {
		out[i] = &model.Employee{
			ID:        employee.ID,
			Details:   employee.Details,
			Tag:       employee.Tag,
			Role:      employee.Role,
			Notes:     employee.Notes,
			UpdatedAt: time.Now().String(),
		}
	}
	return out, nil
}

// Products is the resolver for the products field.
func (r *queryResolver) Products(ctx context.Context) ([]model.Products, error) {
	return products, nil
}

// Teammates is the resolver for the teammates field.
func (r *queryResolver) Teammates(ctx context.Context, team model.Department) ([]*model.Employee, error) {
	r.mux.Lock()
	defer r.mux.Unlock()
	switch team {
	case model.DepartmentMarketing:
		return marketers, nil
	case model.DepartmentOperations:
		return operators, nil
	default:
		return engineers, nil
	}
}

// CurrentTime is the resolver for the currentTime field.
func (r *subscriptionResolver) CurrentTime(ctx context.Context) (<-chan *model.Time, error) {
	ch := make(chan *model.Time)

	go func() {
		defer close(ch)

		for {
			// In our example we'll send the current time every second.
			time.Sleep(1 * time.Second)

			currentTime := time.Now()
			t := &model.Time{
				UnixTime:  int(currentTime.Unix()),
				TimeStamp: currentTime.Format(time.RFC3339),
			}

			// The subscription may have got closed due to the client disconnecting.
			// Hence, we do send in a select block with a check for context cancellation.
			// This avoids goroutine getting blocked forever or panicking,
			select {
			case <-ctx.Done(): // This runs when context gets cancelled. Subscription closes.
				// Handle deregistration of the channel here. `close(ch)`
				return // Remember to return to end the routine.

			case ch <- t: // This is the actual send.
				// Our message went through, do nothing
			}
		}
	}()

	return ch, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

// Subscription returns generated.SubscriptionResolver implementation.
func (r *Resolver) Subscription() generated.SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
