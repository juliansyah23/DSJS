<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('officer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('application_code', 32)->unique();
            $table->enum('service_type', ['sip', 'oss', 'simbg'])->index();
            $table->string('applicant_name', 100)->index();
            $table->string('company_name', 150)->nullable()->index();
            $table->enum('status', ['pending', 'review', 'approved', 'rejected'])->default('pending')->index();
            $table->json('form_data');
            $table->timestamp('submitted_at')->index();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'submitted_at']);
        });

        Schema::create('application_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('sequence');
            $table->string('name', 100);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'rejected'])->default('pending')->index();
            $table->text('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['application_id', 'sequence']);
        });

        Schema::create('application_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->string('label', 150);
            $table->string('original_name');
            $table->string('disk', 50)->default('application_files');
            $table->string('path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_files');
        Schema::dropIfExists('application_stages');
        Schema::dropIfExists('applications');
    }
};