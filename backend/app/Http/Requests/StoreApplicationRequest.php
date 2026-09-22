<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('form_data'))) {
            $decoded = json_decode($this->input('form_data'), true);
            $this->merge(['form_data' => is_array($decoded) ? $decoded : null]);
        }

        if (is_string($this->input('file_labels'))) {
            $decoded = json_decode($this->input('file_labels'), true);
            $this->merge(['file_labels' => is_array($decoded) ? $decoded : null]);
        }
    }

    public function rules(): array
    {
        $max = (int) config('uploads.max_size_kb', 5120);
        $common = [
            'form_data.ktp' => ['required', 'digits:16'],
            'form_data.name' => ['required', 'string', 'min:3', 'max:100'],
            'form_data.phone' => ['required', 'string', 'max:30'],
            'form_data.province' => ['required', 'string', 'max:100'],
            'form_data.city' => ['required', 'string', 'max:100'],
            'form_data.district' => ['required', 'string', 'max:100'],
            'form_data.village' => ['required', 'string', 'max:100'],
            'form_data.address' => ['required', 'string', 'max:1000'],
            'form_data.permitCity' => ['required', 'string', 'max:100'],
            'form_data.permitDistrict' => ['required', 'string', 'max:100'],
            'form_data.permitVillage' => ['required', 'string', 'max:100'],
            'form_data.permitAddress' => ['required', 'string', 'max:1000'],
            'form_data.decName' => ['required', 'string', 'max:100'],
            'form_data.decAddress' => ['required', 'string', 'max:1000'],
            'form_data.education' => ['required', 'string', 'max:100'],
            'form_data.position' => ['required', 'string', 'max:100'],
            'form_data.decPhone' => ['required', 'string', 'max:30'],
            'form_data.institutionLembaga' => ['required', 'string', 'max:150'],
            'form_data.instName' => ['required', 'string', 'max:150'],
            'form_data.instAddress' => ['required', 'string', 'max:1000'],
            'form_data.admin' => ['required', 'string', 'max:100'],
            'form_data.building' => ['required', 'string', 'max:250'],
            'form_data.equipment' => ['required', 'string', 'max:2000'],
            'form_data.curriculum' => ['required', 'string', 'max:5000'],
            'form_data.students' => ['required', 'integer', 'min:1', 'max:1000000'],
            'form_data.fees' => ['required', 'string', 'max:100'],
        ];

        $company = $this->boolean('skip_company') ? [] : [
            'form_data.companyName' => ['required', 'string', 'max:150'],
            'form_data.companyNpwp' => ['required', 'string', 'max:40'],
            'form_data.companyPhone' => ['required', 'string', 'max:30'],
            'form_data.companyEmail' => ['required', 'email', 'max:255'],
            'form_data.businessType' => ['required', 'string', 'max:150'],
            'form_data.companyProvince' => ['required', 'string', 'max:100'],
            'form_data.companyCity' => ['required', 'string', 'max:100'],
            'form_data.companyDistrict' => ['required', 'string', 'max:100'],
            'form_data.companyVillage' => ['required', 'string', 'max:100'],
            'form_data.companyAddress' => ['required', 'string', 'max:1000'],
        ];

        return array_merge([
            'service_type' => ['required', 'in:sip,oss,simbg'],
            'skip_company' => ['required', 'boolean'],
            'draft_id' => ['nullable', 'integer'],
            'form_data' => ['required', 'array'],
            'form_data.*' => ['nullable'],
            'files' => ['required', 'array', 'size:9'],
            'files.*' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf,application/x-pdf', "max:{$max}"],
            'file_labels' => ['required', 'array', 'size:9'],
            'file_labels.*' => ['required', 'string', 'max:150'],
        ], $common, $company);
    }
}