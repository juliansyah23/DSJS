<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', 'in:pending,review,approved,rejected'],
            'officer_id' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'admin')->where('is_active', true))],
            'stage_sequence' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'stage_status' => ['required_with:stage_sequence', 'in:pending,in_progress,completed,rejected'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}