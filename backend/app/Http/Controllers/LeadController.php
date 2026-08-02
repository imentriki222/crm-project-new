<?php

namespace App\Http\Controllers;

use App\Services\LeadService;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadController extends Controller
{
    protected LeadService $leadService;

    public function __construct(LeadService $leadService)
    {
        $this->leadService = $leadService;
    }

    /**
     * Display a listing of leads with filters, search, and pagination.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'priority', 'assigned_to', 'lead_source', 'sort_by', 'sort_order']);
        $perPage = $request->query('per_page', 15);

        $leads = $this->leadService->getLeads($filters, $perPage);

        return LeadResource::collection($leads);
    }

    /**
     * Store a newly created lead in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'company_size' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'lead_source' => 'sometimes|string',
            'status' => 'sometimes|string',
            'priority' => 'sometimes|string',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lead = $this->leadService->createLead($request->all(), $request->user()?->id);

        return response()->json([
            'message' => 'Lead created successfully',
            'data' => new LeadResource($lead->load('assignee'))
        ], 201);
    }

    /**
     * Display the specified lead.
     */
    public function show(int $id)
    {
        $lead = $this->leadService->getLead($id);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        return new LeadResource($lead);
    }

    /**
     * Update the specified lead in storage.
     */
    public function update(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'company_size' => 'nullable|string|max:50',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'lead_source' => 'sometimes|string',
            'status' => 'sometimes|string',
            'priority' => 'sometimes|string',
            'assigned_to' => 'nullable|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lead = $this->leadService->updateLead($id, $request->all(), $request->user()?->id);

        if (!$lead) {
            return response()->json(['message' => 'Lead not found or update failed'], 404);
        }

        return response()->json([
            'message' => 'Lead updated successfully',
            'data' => new LeadResource($lead->load('assignee'))
        ]);
    }

    /**
     * Remove the specified lead from storage.
     */
    public function destroy(int $id)
    {
        $deleted = $this->leadService->deleteLead($id);

        if (!$deleted) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        return response()->json([
            'message' => 'Lead deleted successfully'
        ]);
    }

    /**
     * Export all leads to a CSV file.
     */
    public function export()
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=leads_export.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() {
            $file = fopen('php://output', 'w');
            
            // CSV Header
            fputcsv($file, [
                'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'WhatsApp', 
                'Company Name', 'Job Title', 'Website', 'Industry', 'Company Size', 
                'City', 'Country', 'Lead Source', 'Status', 'Priority', 'Lead Score'
            ]);

            // CSV Data
            Lead::chunk(100, function($leads) use ($file) {
                foreach ($leads as $lead) {
                    fputcsv($file, [
                        $lead->id,
                        $lead->first_name,
                        $lead->last_name,
                        $lead->email,
                        $lead->phone,
                        $lead->whatsapp,
                        $lead->company_name,
                        $lead->job_title,
                        $lead->website,
                        $lead->industry,
                        $lead->company_size,
                        $lead->city,
                        $lead->country,
                        $lead->lead_source,
                        $lead->status,
                        $lead->priority,
                        $lead->lead_score
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import leads from a uploaded CSV file.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048'
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return response()->json(['message' => 'Unable to read CSV file'], 400);
        }

        // Parse header row
        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            return response()->json(['message' => 'Empty CSV file'], 400);
        }

        // Map column headers to database fields (lowercase, strip spaces)
        $mappedHeader = [];
        foreach ($header as $colName) {
            $cleanName = strtolower(trim(str_replace(' ', '_', $colName)));
            $mappedHeader[] = $cleanName;
        }

        $importedCount = 0;
        $userId = $request->user()?->id;

        while (($row = fgetcsv($handle)) !== false) {
            // Skip empty rows
            if (count($row) === 0 || $row[0] === null) {
                continue;
            }

            // Combine row with header keys
            $rowData = array_combine(array_slice($mappedHeader, 0, count($row)), $row);
            
            // Build the data payload (matching leads table columns)
            $leadPayload = [
                'first_name' => $rowData['first_name'] ?? ($rowData['name'] ?? 'Imported'),
                'last_name' => $rowData['last_name'] ?? 'Lead',
                'email' => $rowData['email'] ?? null,
                'phone' => $rowData['phone'] ?? null,
                'whatsapp' => $rowData['whatsapp'] ?? ($rowData['phone'] ?? null),
                'company_name' => $rowData['company_name'] ?? null,
                'job_title' => $rowData['job_title'] ?? null,
                'website' => $rowData['website'] ?? null,
                'industry' => $rowData['industry'] ?? null,
                'company_size' => $rowData['company_size'] ?? null,
                'city' => $rowData['city'] ?? null,
                'country' => $rowData['country'] ?? null,
                'lead_source' => $rowData['lead_source'] ?? 'other',
                'status' => $rowData['status'] ?? 'new',
                'priority' => $rowData['priority'] ?? 'medium',
            ];

            // Save lead using service layer
            $this->leadService->createLead($leadPayload, $userId);
            $importedCount++;
        }

        fclose($handle);

        return response()->json([
            'message' => "Successfully imported {$importedCount} leads."
        ]);
    }
}
