<?php

namespace App\Repositories\Eloquent;

use App\Models\Lead;
use App\Repositories\LeadRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LeadRepository implements LeadRepositoryInterface
{
    /**
     * Get all leads with filtering, search, and pagination.
     */
    public function getFilteredLeads(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::with('assignee');

        // Apply Search (Search in first name, last name, email, company)
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // Apply Status Filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Apply Priority Filter
        if (!empty($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        // Apply Assigned User Filter
        if (!empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        // Apply Lead Source Filter
        if (!empty($filters['lead_source'])) {
            $query->where('lead_source', $filters['lead_source']);
        }

        // Sort Direction and Column
        $sortColumn = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_order'] ?? 'desc';
        
        $allowedColumns = ['first_name', 'last_name', 'company_name', 'lead_score', 'status', 'priority', 'created_at'];
        if (in_array($sortColumn, $allowedColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($perPage);
    }

    /**
     * Find a lead by ID.
     */
    public function findById(int $id): ?Lead
    {
        return Lead::with(['assignee', 'deals', 'activityLogs.user', 'meetings'])->find($id);
    }

    /**
     * Create a new lead.
     */
    public function create(array $data): Lead
    {
        return Lead::create($data);
    }

    /**
     * Update an existing lead.
     */
    public function update(int $id, array $data): ?Lead
    {
        $lead = Lead::find($id);
        if ($lead) {
            $lead->update($data);
            return $lead;
        }
        return null;
    }

    /**
     * Delete a lead by ID.
     */
    public function delete(int $id): bool
    {
        $lead = Lead::find($id);
        if ($lead) {
            return $lead->delete();
        }
        return false;
    }

    /**
     * Get lead counts grouped by status.
     */
    public function getStatusCounts(): array
    {
        $counts = Lead::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // Default layout ensuring we return all statuses
        $defaultStatuses = [
            'new' => 0,
            'contacted' => 0,
            'qualified' => 0,
            'proposal' => 0,
            'negotiation' => 0,
            'won' => 0,
            'lost' => 0
        ];

        return array_merge($defaultStatuses, $counts);
    }

    /**
     * Get monthly leads growth metrics.
     */
    public function getLeadsGrowth(): array
    {
        // Monthly growth metrics (last 6 months)
        $results = Lead::select(
            DB::raw("strftime('%Y-%m', created_at) as month"), // Works for SQLite
            DB::raw('count(*) as total')
        )
        ->groupBy('month')
        ->orderBy('month', 'asc')
        ->take(6)
        ->get();

        // If running in MySQL, fallback/format support:
        if (DB::getDriverName() === 'mysql') {
            $results = Lead::select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('count(*) as total')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->take(6)
            ->get();
        }

        return $results->pluck('total', 'month')->toArray();
    }
}
