<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

            // The SIP form uses the user-facing field name `namaPemohon`,
            // while the API validation contract uses the legacy `decName` key.
            // Normalize the new field before validation so both payload shapes
            // remain supported.
            if (
                $this->input('service_type') === 'sip'
                && is_array($decoded)
                && blank($decoded['decName'] ?? null)
                && filled($decoded['namaPemohon'] ?? null)
            ) {
                $decoded['decName'] = $decoded['namaPemohon'];
            }

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
        $serviceType = $this->input('service_type', 'sip');

        $baseRules = [
            'service_type' => ['required', 'in:sip,oss,simbg'],
            'skip_company' => ['required', 'boolean'],
            'draft_id' => ['nullable', 'integer'],
            'form_data' => ['required', 'array'],
            'form_data.*' => ['nullable'],
        ];

        $commonApplicant = [
            'form_data.ktp' => ['required', 'digits:16'],
            'form_data.name' => ['required', 'string', 'min:3', 'max:100'],
            'form_data.phone' => ['required', 'string', 'max:30'],
            'form_data.province' => ['required', 'string', 'max:100'],
            'form_data.village' => ['required', 'string', 'max:100'],
            'form_data.address' => ['required', 'string', 'max:1000'],
            'form_data.permitCity' => ['required', 'string', 'max:100'],
            'form_data.permitDistrict' => ['required', 'string', 'max:100'],
            'form_data.permitVillage' => ['required', 'string', 'max:100'],
            'form_data.permitAddress' => ['required', 'string', 'max:1000'],
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

        if ($serviceType === 'sip') {
            return array_merge($baseRules, $commonApplicant, $company, $this->sipSpecificRules($max));
        }

        if ($serviceType === 'simbg') {
            return array_merge($baseRules, $commonApplicant, $company, $this->simbgSpecificRules());
        }

        if ($serviceType === 'oss') {
            return array_merge($baseRules, $commonApplicant, $company, $this->ossSpecificRules());
        }

        return $baseRules;
    }

    private function sipSpecificRules(int $max): array
    {
        // The current SIP frontend has permit-specific fields and document
        // counts. The old fields below are kept for legacy SIP submissions,
        // but must not be required for the current permit configurations.
        if (filled($this->input('form_data.permitTypeValue'))) {
            $fileCount = [
                '128' => 8,
                '263' => 11,
                '264' => 11,
                '267' => 11,
                '269' => 9,
                '279' => 12,
                '449' => 9,
            ][$this->input('form_data.permitTypeValue')] ?? null;

            $files = ['required', 'array'];
            $labels = ['required', 'array'];
            if ($fileCount !== null) {
                $files[] = "size:{$fileCount}";
                $labels[] = "size:{$fileCount}";
            } else {
                $files[] = 'min:1';
                $files[] = 'max:20';
                $labels[] = 'min:1';
                $labels[] = 'max:20';
            }

            return [
                'form_data.permitTypeValue' => ['required', 'string', 'max:50'],
                'form_data.permitTypeName' => ['nullable', 'string', 'max:255'],
                'files' => $files,
                'files.*' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf,application/x-pdf', "max:{$max}"],
                'file_labels' => $labels,
                'file_labels.*' => ['required', 'string', 'max:150'],
            ];
        }

        return [
            'form_data.decName' => ['required', 'string', 'max:100'],
            'form_data.decAddress' => ['required', 'string', 'max:1000'],
            'form_data.education' => ['required', 'string', 'max:100'],
            'form_data.position' => ['required', 'string', 'max:100'],
            'form_data.decPhone' => ['required', 'string', 'max:30'],
            'form_data.jumlahPenghuni' => ['required', 'integer', 'min:0'],
            'form_data.instName' => ['required', 'string', 'max:150'],
            'form_data.instAddress' => ['required', 'string', 'max:1000'],
            'form_data.admin' => ['required', 'string', 'max:100'],
            'form_data.building' => ['required', 'string', 'max:250'],
            'form_data.equipment' => ['required', 'string', 'max:2000'],
            'form_data.curriculum' => ['required', 'string', 'max:5000'],
            'form_data.students' => ['required', 'integer', 'min:1', 'max:1000000'],
            'form_data.fees' => ['required', 'string', 'max:100'],
            'files' => ['required', 'array', 'size:9'],
            'files.*' => ['required', 'file', 'mimes:pdf', 'mimetypes:application/pdf,application/x-pdf', "max:{$max}"],
            'file_labels' => ['required', 'array', 'size:9'],
            'file_labels.*' => ['required', 'string', 'max:150'],
        ];
    }

    private function simbgSpecificRules(): array
    {
        $rules = [
            'form_data.nomorDokumenIzinPemanfaatanRuang' => ['required', 'string', 'max:255'],
            'form_data.gsb' => ['required', 'numeric', 'min:0'],
            'form_data.kdb' => ['required', 'numeric', 'min:0'],
            'form_data.klb' => ['required', 'numeric', 'min:0'],
            'form_data.kdh' => ['required', 'numeric', 'min:0'],
            'form_data.kepemilikanBangunanGedung' => ['required', 'string', 'in:Perorangan,Badan Usaha,Pemerintah'],
            'form_data.gunakanDesainPrototipe' => ['required', 'string', 'in:Ya,Tidak'],
            'form_data.jumlahBuktiKepemilikanTanah' => ['required', 'integer', 'min:0'],
            'form_data.latitudeBangunan' => ['required', 'string', 'regex:/^-?\d{1,2}\.\d+$/', 'max:50'],
            'form_data.longitudeBangunan' => ['required', 'string', 'regex:/^-?\d{1,3}\.\d+$/', 'max:50'],
        ];

        // Conditional fields based on gunakanDesainPrototipe
        $gunakanPrototipe = $this->input('form_data.gunakanDesainPrototipe');
        if ($gunakanPrototipe === 'Ya') {
            $rules['form_data.jumlahUnitDibangun'] = ['required', 'integer', 'min:0'];
            $rules['form_data.jumlahPenghuni'] = ['required', 'integer', 'min:0'];
            $rules['form_data.desainPrototipe'] = ['required', 'string', 'max:255'];
        } elseif ($gunakanPrototipe === 'Tidak') {
            $rules['form_data.penggunaanBangunanLebihDari5Tahun'] = [
                'required',
                'string',
                Rule::in(['Ya, Lebih dari 5 tahun', 'Tidak, Kurang dari 5 tahun']),
            ];
            $rules['form_data.fungsiBangunan'] = ['required', 'string', 'max:500'];
            $rules['form_data.kategoriBangunan'] = ['required', 'string', 'in:Rumah Tinggal Deret,Rumah Tinggal Deret (MBR),Rumah Tinggal Tunggal,Rumah Tinggal Tunggal (MBR),Rumah Susun,Rumah Susun (MBR)'];
            $rules['form_data.memilikiBasemen'] = ['required', 'string', 'in:Memiliki,Tidak Memiliki'];
            $rules['form_data.namaBangunan'] = ['required', 'string', 'max:255'];
            $rules['form_data.luasTotalBangunanPerUnit'] = ['required', 'numeric', 'min:0'];
            $rules['form_data.tinggiBangunan'] = ['required', 'numeric', 'min:0'];
            $rules['form_data.jumlahLantai'] = ['required', 'string', 'max:50'];
            $rules['form_data.jumlahUnit'] = ['required', 'integer', 'min:0'];
            $rules['form_data.estimasiJumlahPenghuni'] = ['required', 'integer', 'min:0'];
        }

        return array_merge($rules, [
            'files' => ['nullable', 'array', 'max:1'],
            'files.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:102400'],
            'file_labels' => ['nullable', 'array', 'max:1'],
            'file_labels.*' => ['string', 'max:150'],
        ]);
    }

    private function ossSpecificRules(): array
    {
        return [
            'form_data.namaUsaha' => ['required', 'string', 'max:255'],
            'form_data.skalaUsaha' => ['required', 'string', 'in:Mikro,Kecil,Menengah,Besar,Usaha Mikro,Usaha Kecil,Usaha Menengah,Usaha Besar'],
            'form_data.tingkatRisiko' => ['required', 'string', 'in:Rendah,Menengah Rendah,Menengah Tinggi,Tinggi'],
            'form_data.kbli' => ['required', 'string', 'size:5', 'regex:/^\d{5}$/'],
            'form_data.deskripsiKegiatanUsaha' => ['required', 'string', 'max:1000'],
            'form_data.alamatUsaha' => ['required', 'string', 'max:500'],
            'files' => ['prohibited'],
            'file_labels' => ['prohibited'],
        ];
    }
}