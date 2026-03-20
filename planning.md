# Planning — Workflow Automasi Bisnis

## Konsep

Ganti "Workflow Orchestration Pipeline" menjadi **Automasi Bisnis** — sistem trigger-based automation yang simpel untuk UMKM. Konsep inti: **Trigger → Kondisi (opsional) → Aksi**.

---

## 1. Database Schema

### A. Migrasi tabel `workflows` (update kolom)

Kolom yang dibutuhkan:
- `id` (uuid, PK)
- `workspace_id` (uuid, FK)
- `name` (text) — nama automasi, e.g. "Auto-Konfirmasi Pesanan Kecil"
- `description` (text, nullable)
- `is_active` (boolean, default false)
- `trigger_type` (text) — enum: `order_created`, `order_status_changed`, `chat_keyword`, `new_customer`, `schedule`, `token_limit`
- `trigger_config` (jsonb) — config spesifik per trigger type, e.g. `{ "keyword": "komplain" }`, `{ "from_status": "pending", "to_status": "paid" }`, `{ "schedule": "daily_08" }`
- `condition_field` (text, nullable) — field yang dicek, e.g. `order.total`, `order.item_count`
- `condition_operator` (text, nullable) — `<`, `>`, `=`, `contains`, `is_empty`
- `condition_value` (text, nullable) — nilai pembanding, e.g. `100000`
- `action_type` (text) — enum: `send_message`, `update_order_status`, `notify_webhook`, `auto_reply`, `assign_agent`
- `action_config` (jsonb) — config spesifik per action, e.g. `{ "message": "Terima kasih sudah order!" }`, `{ "new_status": "confirmed" }`, `{ "webhook_url": "..." }`
- `agent_id` (uuid, nullable, FK) — agent terkait (opsional)
- `last_triggered_at` (timestamptz, nullable)
- `trigger_count` (integer, default 0)
- `created_by` (uuid, nullable)
- `created_at`, `updated_at` (timestamptz)

### B. Tabel `workflow_logs` (baru)

Track setiap eksekusi automasi:
- `id` (uuid, PK)
- `workflow_id` (uuid, FK)
- `workspace_id` (uuid, FK)
- `trigger_data` (jsonb) — data yang trigger automasi
- `condition_met` (boolean) — apakah kondisi terpenuhi
- `action_result` (jsonb) — hasil eksekusi aksi
- `status` (text) — `success`, `failed`, `skipped` (kondisi tidak terpenuhi)
- `error` (text, nullable)
- `executed_at` (timestamptz)

---

## 2. UI — Halaman List `/workflows`

### Redesign:
- Ganti title: "Workflows" → "Automasi"
- Ganti description: → "Otomatiskan proses bisnis berdasarkan event"
- Sidebar label: "Automasi" (icon: Zap)
- Bahasa Indonesia semua

### Stat cards (4):
- Total Automasi
- Aktif
- Dijalankan Hari Ini
- Gagal Minggu Ini

### List card per workflow:
- Icon berdasarkan `trigger_type`
- Nama + deskripsi singkat
- Badge: Aktif/Nonaktif
- Info: "Terakhir jalan: 2 jam lalu" + "Dijalankan 45x"
- Toggle switch untuk aktif/nonaktif
- Dropdown: Edit, Duplikat, Hapus

### Create dialog:
- Dropdown trigger type (dengan icon + deskripsi singkat tiap opsi)
- Setelah pilih trigger → form config muncul sesuai trigger type
- Kondisi (opsional, collapsible)
- Dropdown action type → form config sesuai action type
- Agent selector (opsional)

---

## 3. UI — Halaman Detail `/workflows/[workflowId]`

### Layout: 2 kolom

**Kiri (utama) — Visual Flow:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│  TRIGGER     │───▶│  KONDISI     │───▶│  AKSI           │
│  [icon]      │    │  (opsional)  │    │  [icon]         │
│  Deskripsi   │    │  Deskripsi   │    │  Deskripsi      │
└─────────────┘    └──────────────┘    └─────────────────┘
```
- 3 card yang connected dengan garis panah
- Klik card → panel kanan berubah ke config card tersebut
- Warna berbeda per type (trigger=blue, kondisi=amber, aksi=emerald)

**Kanan (sidebar) — Config Panel:**
- Form dinamis berdasarkan card yang diklik
- Trigger config: dropdown + input sesuai trigger type
- Kondisi config: field selector + operator + value
- Aksi config: dropdown + input sesuai action type
- Tombol Simpan per section

### Header:
- Back button + Nama automasi (editable inline)
- Badge Aktif/Nonaktif + Toggle
- Tombol: Simpan, Test (dry run)

### Bawah — Log Eksekusi (collapsible):
- Tabel/list log terakhir 20 eksekusi
- Kolom: Waktu, Trigger Data, Kondisi, Hasil, Status (badge)
- Filter: Semua / Sukses / Gagal / Dilewati

---

## 4. Trigger Types — Detail Config

| Trigger | Config Fields | Contoh |
|---|---|---|
| `order_created` | — (tanpa config tambahan) | Setiap pesanan baru masuk |
| `order_status_changed` | `from_status`, `to_status` (dropdown) | Dari "pending" ke "confirmed" |
| `chat_keyword` | `keyword` (text), `match_type` (exact/contains) | Pesan mengandung "komplain" |
| `new_customer` | — | Pelanggan baru terdaftar |
| `schedule` | `frequency` (daily/weekly/monthly), `time` (jam) | Setiap hari jam 08:00 |
| `token_limit` | `threshold_percent` (number) | Token usage > 80% limit |

---

## 5. Action Types — Detail Config

| Action | Config Fields | Contoh |
|---|---|---|
| `send_message` | `message` (textarea), `session_id` (opsional) | Kirim "Terima kasih!" ke pelanggan |
| `update_order_status` | `new_status` (dropdown) | Auto-confirm pesanan |
| `notify_webhook` | `webhook_url`, `payload_template` | POST ke URL owner |
| `auto_reply` | `template` (textarea), `agent_id` | Balas otomatis via agent |
| `assign_agent` | `agent_id` (dropdown) | Assign ke agent CS khusus |

---

## 6. API Routes

| Method | Route | Fungsi |
|---|---|---|
| GET | `/api/workflows` | List automasi workspace |
| POST | `/api/workflows` | Buat automasi baru |
| GET | `/api/workflows/[id]` | Detail automasi + config |
| PATCH | `/api/workflows/[id]` | Update automasi |
| DELETE | `/api/workflows/[id]` | Hapus automasi |
| POST | `/api/workflows/[id]/toggle` | Toggle aktif/nonaktif |
| POST | `/api/workflows/[id]/test` | Test/dry run automasi |
| GET | `/api/workflows/[id]/logs` | Log eksekusi automasi |

---

## 7. Urutan Eksekusi

| # | Task | Effort | Detail |
|---|---|---|---|
| 1 | Migration schema | Kecil | Update `workflows` + buat `workflow_logs` |
| 2 | API routes | Sedang | CRUD + toggle + test + logs |
| 3 | List page redesign | Sedang | Stat cards, toggle, bahasa Indonesia |
| 4 | Detail page redesign | Besar | Visual flow, dynamic config form, log panel |
| 5 | Sidebar update | Kecil | Ganti label + icon |

---

## 8. Contoh Automasi Populer (Preset/Template)

Bisa ditawarkan saat user buat automasi baru:

1. **Auto-Konfirmasi Pesanan Kecil** — Order masuk + total < Rp100K → auto-confirm
2. **Follow-up Pelanggan Baru** — Customer baru → kirim pesan sapaan + promo
3. **Eskalasi Komplain** — Chat keyword "komplain" → notify owner via webhook
4. **Ucapan Terima Kasih** — Order completed → kirim pesan terima kasih
5. **Ringkasan Harian** — Jadwal 08:00 → kirim summary order pending ke owner
6. **Alert Stok Habis** — Chat keyword "stok" → auto-reply "maaf stok habis"

---

## Best Practices

- Semua text **Bahasa Indonesia**
- Komponen max **~150 baris**, pecah jika lebih
- Button style: `bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary`
- Loading state + EmptyState di setiap halaman
- Validasi input di API route, reject early
- Workspace scoping di semua query (`eq('workspace_id', workspaceId)`)
- Hapus semua demo/hardcoded data, connect ke DB real
