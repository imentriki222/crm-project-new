<?php

namespace App\Repositories;

use App\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

interface LeadRepositoryInterface
{
    /**
     * Get all leads with filtering, search, and pagination.
     */
    public function getFilteredLeads(array $filters, int $perPage = 15): LengthAwarePaginator;

    /**
     * Find a lead by ID.
     */
    public function findById(int $id): ?Lead;

    /**
     * Create a new lead.
     */
    public function create(array $data): Lead;

    /**
     * Update an existing lead.
     */
    public function update(int $id, array $data): ?Lead;

    /**
     * Delete a lead by ID.
     */
    public function delete(int $id): bool;

    /**
     * Get lead counts grouped by status.
     */
    public function getStatusCounts(): array;

    /**
     * Get monthly leads growth metrics.
     */
    public function getLeadsGrowth(): array;
}
