<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
            'role' => ['sometimes', 'required', 'in:user,admin'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ];
    }
}