<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'age_group' => ['required', 'in:remaja,dewasa,pralansia,lansia'],
            'color_blind' => ['required', 'boolean'],
            'service_model' => ['required', 'in:mandiri,bantuan,bantuan_penuh'],
            'internet_condition' => ['required', 'in:stabil,tidak_stabil'],
        ];
    }
}