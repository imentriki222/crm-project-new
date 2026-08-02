<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\AutomationController;

// ==========================================
// PUBLIC ROUTES
// ==========================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/webhooks/n8n', [AutomationController::class, 'webhookReceiver']);

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

// ==========================================
// PROTECTED API ROUTES (JWT Authenticated)
// ==========================================
Route::middleware(['jwt'])->group(function () {

    // Auth actions
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/users', [AuthController::class, 'users']);

    // Dashboard Stats and Metrics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/charts', [DashboardController::class, 'charts']);
    Route::get('/dashboard/activities', [DashboardController::class, 'activities']);

    // Lead Management
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/export', [LeadController::class, 'export']);
    Route::post('/leads/import', [LeadController::class, 'import']);
    Route::get('/leads/{id}', [LeadController::class, 'show']);
    Route::put('/leads/{id}', [LeadController::class, 'update']);
    Route::delete('/leads/{id}', [LeadController::class, 'destroy']);

    // Sales Pipeline (Kanban Deals)
    Route::get('/deals', [DealController::class, 'index']);
    Route::post('/deals', [DealController::class, 'store']);
    Route::put('/deals/{id}/stage', [DealController::class, 'updateStage']);

    // Marketing Campaigns & Templates
    Route::get('/templates', [CampaignController::class, 'listTemplates']);
    Route::post('/templates', [CampaignController::class, 'storeTemplate']);
    Route::get('/templates/{id}', [CampaignController::class, 'showTemplate']);
    Route::put('/templates/{id}', [CampaignController::class, 'updateTemplate']);
    Route::delete('/templates/{id}', [CampaignController::class, 'destroyTemplate']);

    Route::get('/campaigns', [CampaignController::class, 'listCampaigns']);
    Route::post('/campaigns', [CampaignController::class, 'storeCampaign']);
    Route::get('/campaigns/{id}', [CampaignController::class, 'showCampaign']);
    Route::post('/campaigns/{id}/send', [CampaignController::class, 'sendCampaign']);
    Route::delete('/campaigns/{id}', [CampaignController::class, 'destroyCampaign']);

    // Meeting Scheduler (Calendar)
    Route::get('/meetings', [MeetingController::class, 'index']);
    Route::post('/meetings', [MeetingController::class, 'store']);
    Route::put('/meetings/{id}', [MeetingController::class, 'update']);
    Route::delete('/meetings/{id}', [MeetingController::class, 'destroy']);

    // OpenAI AI Assistant integrations
    Route::post('/ai/assistant', [AIController::class, 'salesAssistant']);
    Route::post('/ai/generate-email', [AIController::class, 'generateEmail']);
    Route::post('/ai/suggest-reply', [AIController::class, 'suggestReply']);
    Route::post('/ai/qualify-lead/{id}', [AIController::class, 'qualifyLead']);

    // Workflow Automations
    Route::get('/automations', [AutomationController::class, 'index']);
    Route::post('/automations', [AutomationController::class, 'store']);
    Route::post('/automations/{id}/toggle', [AutomationController::class, 'toggle']);
    Route::delete('/automations/{id}', [AutomationController::class, 'destroy']);
});
