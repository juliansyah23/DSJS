<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('age_group', ['remaja', 'dewasa', 'pralansia', 'lansia']);
            $table->boolean('color_blind')->default(false);
            $table->enum('service_model', ['mandiri', 'bantuan', 'bantuan_penuh']);
            $table->enum('internet_condition', ['stabil', 'tidak_stabil']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};