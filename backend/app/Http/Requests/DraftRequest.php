<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_type' => ['nullable', 'in:sip,oss,simbg'],
            'current_step' => ['required', 'integer', 'between:1,5'],
            'skip_company' => ['required', 'boolean'],
            'form_data' => ['required', 'array'],
            'form_data.*' => ['nullable', 'string', 'max:5000'],
        ];
    }
}