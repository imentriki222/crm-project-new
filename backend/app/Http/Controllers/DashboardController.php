<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Deal;
use App\Models\ActivityLog;
use App\Models\Campaign;
use App\Repositories\LeadRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected LeadRepositoryInterface $leadRepository;

    public function __construct(LeadRepositoryInterface $leadRepository)
    {
        $this->leadRepository = $leadRepository;
    }

    /**
     * Get statistics cards values.
     */
    public function stats(Request $request)
    {
        $totalLeads = Lead::count();
        $hotLeads = Lead::where('lead_score', '>=', 70)->count();
        $coldLeads = Lead::where('lead_score', '<', 30)->count();

        // Conversion Rate: (Leads in status 'won' / Total Leads) * 100
        $wonLeads = Lead::where('status', 'won')->count();
        $conversionRate = $totalLeads > 0 ? round(($wonLeads / $totalLeads) * 100, 2) : 0;

        // Total Revenue: Sum value of deals in stage 'won'
        $revenue = Deal::where('stage', 'won')->sum('value');

        return response()->json([
            'total_leads' => $totalLeads,
            'hot_leads' => $hotLeads,
            'cold_leads' => $coldLeads,
            'conversion_rate' => $conversionRate,
            'revenue' => (float)$revenue
        ]);
    }

    /**
     * Get chart statistics data.
     */
    public function charts(Request $request)
    {
        // 1. Leads Growth (monthly)
        $leadsGrowth = $this->leadRepository->getLeadsGrowth();

        // 2. Sales Performance (deals count and sum value grouped by stage)
        $salesPerformance = Deal::select('stage', DB::raw('count(*) as count'), DB::raw('sum(value) as total_value'))
            ->groupBy('stage')
            ->get()
            ->keyBy('stage')
            ->toArray();

        $defaultStages = [
            'new_lead' => ['count' => 0, 'total_value' => 0],
            'contacted' => ['count' => 0, 'total_value' => 0],
            'meeting_scheduled' => ['count' => 0, 'total_value' => 0],
            'proposal_sent' => ['count' => 0, 'total_value' => 0],
            'negotiation' => ['count' => 0, 'total_value' => 0],
            'won' => ['count' => 0, 'total_value' => 0],
            'lost' => ['count' => 0, 'total_value' => 0]
        ];

        foreach ($defaultStages as $stage => $defaults) {
            if (isset($salesPerformance[$stage])) {
                $defaultStages[$stage] = [
                    'count' => (int)$salesPerformance[$stage]['count'],
                    'total_value' => (float)$salesPerformance[$stage]['total_value']
                ];
            }
        }

        // 3. Campaign Performance (aggregate statistics of all campaigns)
        $campaignStats = Campaign::select(
            DB::raw('sum(sent_count) as sent'),
            DB::raw('sum(delivered_count) as delivered'),
            DB::raw('sum(opened_count) as opened'),
            DB::raw('sum(clicked_count) as clicked')
        )->first();

        return response()->json([
            'leads_growth' => $leadsGrowth,
            'sales_performance' => $defaultStages,
            'campaigns' => [
                'sent' => (int)($campaignStats->sent ?? 0),
                'delivered' => (int)($campaignStats->delivered ?? 0),
                'opened' => (int)($campaignStats->opened ?? 0),
                'clicked' => (int)($campaignStats->clicked ?? 0),
            ]
        ]);
    }

    /**
     * Get recent activities.
     */
    public function activities(Request $request)
    {
        $activities = ActivityLog::with(['lead', 'user'])
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'details' => $log->details,
                    'lead_id' => $log->lead_id,
                    'lead_name' => $log->lead ? $log->lead->first_name . ' ' . $log->lead->last_name : 'Deleted Lead',
                    'user_name' => $log->user ? $log->user->first_name . ' ' . $log->user->last_name : 'System',
                    'created_at' => $log->created_at?->diffForHumans(),
                ];
            });

        return response()->json(['data' => $activities]);
    }
}
