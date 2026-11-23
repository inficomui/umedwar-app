# 'माझे प्रमुख संकल्प' (Sankalp / Manifesto) Backend & Admin Panel Implementation Guide
========================================================================================

## 1. Overview & System Flow (सिस्टम अवलोकन)
The mobile app now supports a rich, two-tier "माझे प्रमुख संकल्प" (My Key Resolutions) architecture:
1. **Home Screen Card:** Displays the logo/image, resolution number, and main heading. Tapping it opens the detailed page.
2. **Details Page (`/resolution-detail`):** Displays the logo, main heading, संकल्प क्रमांक, "माझा संकल्प" (Core Statement), point-to-point "माझे धोरण" (Numbered Policy Points), and "कृती आराखडा" (Action Plan).
3. **All Resolutions Screen (`/resolutions`):** Displays candidate vision ("माझी विकासाची भूमिका"), search/filter across all 25 resolutions, candidate principles ("माझे विकासविषयक कार्यतत्त्व"), and citizen suggestions.

---

## 2. Database Schema (डेटाबेस रचना)

You can choose between **Relational Approach (Normalized)** or **JSON Column Approach**. Both are provided below.

### Approach A: MySQL / PostgreSQL (Normalized Relational) - Recommended

```sql
-- 1. Main Resolutions Table
CREATE TABLE `resolutions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,            -- UUID or auto-increment ID
  `sankalp_number` INT NOT NULL UNIQUE,             -- 1, 2, 3 ... 25
  `title` VARCHAR(255) NOT NULL,                    -- Main Heading e.g., "दर्जेदार रस्ते व दळणवळण व्यवस्था"
  `short_title` VARCHAR(100) NULL,                  -- Short Card Title e.g., "चांगला पायाभूत विकास"
  `logo_url` VARCHAR(500) NULL,                     -- Uploaded Logo/Image URL
  `icon_name` VARCHAR(50) DEFAULT 'star',           -- MaterialCommunityIcons fallback name
  `category` VARCHAR(100) NULL,                     -- e.g., "पायाभूत सुविधा", "शेती", "शिक्षण"
  `sankalp_statement` TEXT NOT NULL,                -- "माझा संकल्प" (The resolution promise)
  `action_plan` TEXT NULL,                          -- "कृती आराखडा" (Execution plan)
  `sort_order` INT DEFAULT 0,                       -- Ordering index
  `is_active` TINYINT(1) DEFAULT 1,                 -- 1 = Active, 0 = Inactive
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Point-to-Point Policy Items Table ("माझे धोरण")
CREATE TABLE `resolution_policies` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `resolution_id` VARCHAR(36) NOT NULL,
  `point_order` INT NOT NULL DEFAULT 1,             -- 1, 2, 3 ...
  `policy_text` TEXT NOT NULL,                      -- Individual point text
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_res_policies` FOREIGN KEY (`resolution_id`) 
    REFERENCES `resolutions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Approach B: PostgreSQL / MySQL 5.7+ (JSON Column Approach - Fast & Simple)

```sql
CREATE TABLE `resolutions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `sankalp_number` INT NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `short_title` VARCHAR(100) NULL,
  `logo_url` VARCHAR(500) NULL,
  `icon_name` VARCHAR(50) DEFAULT 'star',
  `category` VARCHAR(100) NULL,
  `sankalp_statement` TEXT NOT NULL,
  `policies` JSON NOT NULL,                         -- Array of strings: ["मुद्दा १...", "मुद्दा २..."]
  `action_plan` TEXT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 3. REST API Specifications (API एंडपॉइंट्स)

### 3.1 Public Endpoints (For Mobile App)

#### `GET /api/v1/resolutions`
Fetches all active resolutions sorted by `sankalp_number` or `sort_order`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Resolutions fetched successfully",
  "data": [
    {
      "id": "sankalp-01",
      "sankalpNumber": 1,
      "title": "दर्जेदार रस्ते व दळणवळण व्यवस्था",
      "shortTitle": "चांगला पायाभूत विकास",
      "logoUrl": "https://backend.misachinmalik.in/uploads/resolutions/road.png",
      "iconName": "road-variant",
      "category": "पायाभूत सुविधा",
      "sankalpStatement": "कोपरगाव तालुक्यातील प्रत्येक गाव, वाडी-वस्ती आणि प्रमुख रस्ते यांना सुरक्षित व दर्जेदार दळणवळण सुविधा उपलब्ध करून देण्यासाठी सातत्याने प्रयत्न करणे.",
      "policies": [
        "गावांना जोडणाऱ्या रस्त्यांची सद्यस्थिती तपासणे.",
        "खराब व खड्डेमय रस्त्यांची गावनिहाय यादी तयार करणे.",
        "प्रमुख रस्त्यांच्या दुरुस्ती व रुंदीकरणासाठी पाठपुरावा."
      ],
      "actionPlan": "गावनिहाय रस्ते सर्वेक्षण, प्राधान्यक्रम निश्चित करणे, संबंधित विभागाकडे प्रस्ताव सादर करणे आणि काम पूर्ण होईपर्यंत पाठपुरावा करणे.",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

#### `GET /api/v1/resolutions/:id`
Fetches a single resolution by UUID or `sankalpNumber`.

---

### 3.2 Admin Protected Endpoints (For Admin Panel)

#### `POST /api/v1/admin/resolutions`
Creates a new resolution. Accepts `multipart/form-data` for logo image upload and text fields.

**Form-Data Payload:**
| Key | Type | Description |
|---|---|---|
| `logo` | File (image/png, image/jpeg, image/webp) | Resolution logo / image file |
| `sankalpNumber` | Number | Sankalp Number (e.g. 1) |
| `title` | String | Main Heading (e.g. "दर्जेदार रस्ते व दळणवळण व्यवस्था") |
| `shortTitle` | String | Short title for home card (e.g. "चांगला पायाभूत विकास") |
| `iconName` | String | Fallback icon name (e.g. "road-variant") |
| `category` | String | Category (e.g. "पायाभूत सुविधा") |
| `sankalpStatement` | String | "माझा संकल्प" promise |
| `actionPlan` | String | "कृती आराखडा" text |
| `policies` | JSON string or Array | `["मुद्दा १...", "मुद्दा २..."]` |
| `sortOrder` | Number | Display position index |
| `isActive` | Boolean | `1` or `0` |

#### `PUT /api/v1/admin/resolutions/:id`
Updates an existing resolution. Can replace logo image or keep existing one.

#### `DELETE /api/v1/admin/resolutions/:id`
Soft deletes or removes the resolution.

#### `PUT /api/v1/admin/resolutions/reorder`
Reorders list with array of `{ id, sortOrder }`.

---

## 4. Admin Panel Form Upgrade (अस्तित्वातील फॉर्म कसा अपडेट करायचा?)

In your current Admin Panel, the form likely only has `title` and `iconName`.
Here is the step-by-step layout of the **New & Improved Admin Form**:

### 4.1 Form Fields Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🏛️ संकल्प जोडा / अपडेट करा (Add / Edit Resolution)                       │
├────────────────────────────────────────────────────────────────────────┤
│ [ १. संकल्प क्रमांक (Number) ]    [ २. कॅटेगरी (Category) ]             │
│  उदा. 1                           उदा. पायाभूत सुविधा                  │
│                                                                        │
│ [ ३. मुख्य शीर्षक (Main Heading) * ]                                   │
│  उदा. दर्जेदार रस्ते व दळणवळण व्यवस्था                                  │
│                                                                        │
│ [ ४. संक्षिप्त शीर्षक (Short Card Title) ]                             │
│  उदा. चांगला पायाभूत विकास (होम पेजवरील कार्डसाठी)                    │
│                                                                        │
│ [ ५. लोगो इमेज (Logo Image Upload) ]                                   │
│  📁 [ Choose File ] (PNG, JPG, WEBP, SVG)                              │
│  [ प्रिव्ह्यू: 🖼️ ]                                                     │
│                                                                        │
│ [ ६. माझा संकल्प (Resolution Statement / Vision) * ]                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ कोपरगाव तालुक्यातील प्रत्येक गाव, वाडी-वस्ती आणि...               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ [ ७. माझे धोरण - पॉईंट-टू-पॉईंट पर्याय (Point-to-Point Options) * ]   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [१] गावांना जोडणाऱ्या रस्त्यांची सद्यस्थिती तपासणे.          [✕] │  │
│  │ [२] खराब व खड्डेमय रस्त्यांची गावनिहाय यादी तयार करणे.      [✕] │  │
│  │ [३] प्रमुख रस्त्यांच्या दुरुस्ती व रुंदीकरणासाठी पाठपुरावा. [✕] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ➕ नवीन मुद्दा जोडा (+ Add Point)                                     │
│                                                                        │
│ [ ८. कृती आराखडा (Action Plan) ]                                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ गावनिहाय रस्ते सर्वेक्षण, प्राधान्यक्रम निश्चित करणे...         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ [ ९. क्रम (Sort Order): 1 ]   [ १०. स्थिती: [✓] सक्रिय (Active) ]      │
│                                                                        │
│ [💾 सेव्ह करा (Save Resolution)]      [रद्द करा (Cancel)]              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Ready-to-Use Admin Panel Form Implementation

### A. React / Next.js / Vue Component (Frontend Admin Panel)

```tsx
import React, { useState } from "react";

interface ResolutionFormData {
  id?: string;
  sankalpNumber: number;
  title: string;
  shortTitle: string;
  category: string;
  sankalpStatement: string;
  policies: string[];
  actionPlan: string;
  iconName: string;
  isActive: boolean;
  logoFile: File | null;
  existingLogoUrl?: string;
}

export function ResolutionForm({
  initialData,
  onSubmit,
}: {
  initialData?: ResolutionFormData;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [sankalpNumber, setSankalpNumber] = useState(initialData?.sankalpNumber || 1);
  const [title, setTitle] = useState(initialData?.title || "");
  const [shortTitle, setShortTitle] = useState(initialData?.shortTitle || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [sankalpStatement, setSankalpStatement] = useState(initialData?.sankalpStatement || "");
  const [actionPlan, setActionPlan] = useState(initialData?.actionPlan || "");
  const [iconName, setIconName] = useState(initialData?.iconName || "star");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Dynamic Point-to-Point Policies State
  const [policies, setPolicies] = useState<string[]>(
    initialData?.policies && initialData.policies.length > 0
      ? initialData.policies
      : [""]
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(initialData?.existingLogoUrl || "");

  // Add a new empty policy point
  const handleAddPolicy = () => {
    setPolicies([...policies, ""]);
  };

  // Update policy at specific index
  const handlePolicyChange = (index: number, value: string) => {
    const updated = [...policies];
    updated[index] = value;
    setPolicies(updated);
  };

  // Remove policy point
  const handleRemovePolicy = (index: number) => {
    if (policies.length <= 1) {
      setPolicies([""]);
      return;
    }
    setPolicies(policies.filter((_, i) => i !== index));
  };

  // Handle Logo file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out blank points
    const validPolicies = policies.map((p) => p.trim()).filter((p) => p.length > 0);

    const data = new FormData();
    data.append("sankalpNumber", String(sankalpNumber));
    data.append("title", title.trim());
    data.append("shortTitle", shortTitle.trim());
    data.append("category", category.trim());
    data.append("sankalpStatement", sankalpStatement.trim());
    data.append("actionPlan", actionPlan.trim());
    data.append("iconName", iconName);
    data.append("isActive", isActive ? "1" : "0");
    data.append("policies", JSON.stringify(validPolicies));

    if (logoFile) {
      data.append("logo", logoFile);
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
        संकल्प फॉर्म (Add / Edit Resolution)
      </h2>

      {/* Sankalp Number & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            संकल्प क्रमांक (Sankalp Number) *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            required
            value={sankalpNumber}
            onChange={(e) => setSankalpNumber(Number(e.target.value))}
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            कॅटेगरी (Category)
          </label>
          <input
            type="text"
            placeholder="उदा. पायाभूत सुविधा, शेती, शिक्षण"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Main Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          मुख्य शीर्षक (Main Heading) *
        </label>
        <input
          type="text"
          required
          placeholder="उदा. दर्जेदार रस्ते व दळणवळण व्यवस्था"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Short Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          संक्षिप्त शीर्षक (Short Card Title - होम पेजसाठी)
        </label>
        <input
          type="text"
          placeholder="उदा. चांगला पायाभूत विकास"
          value={shortTitle}
          onChange={(e) => setShortTitle(e.target.value)}
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Logo Image Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          लोगो / इमेज (Logo Image)
        </label>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="w-12 h-12 rounded-lg object-contain border p-1 bg-gray-50"
            />
          ) : null}
        </div>
      </div>

      {/* "माझा संकल्प" Statement */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          माझा संकल्प (The Resolution Promise / Vision) *
        </label>
        <textarea
          rows={3}
          required
          placeholder="या संकल्पाची मुख्य भूमिका व ध्येय येथे लिहा..."
          value={sankalpStatement}
          onChange={(e) => setSankalpStatement(e.target.value)}
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Point to Point Policy Builder ("माझे धोरण") */}
      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <label className="block text-sm font-bold text-orange-900">
              📋 माझे धोरण (Point-to-Point Options) *
            </label>
            <p className="text-xs text-orange-700">
              प्रत्येक मुद्दा वेगळा जोडा. ॲपमध्ये हे मुद्दे १, २, ३ अशा क्रमांकांनी दिसतील.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPolicy}
            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 flex items-center gap-1 shadow-sm"
          >
            + आणखी मुद्दा जोडा
          </button>
        </div>

        <div className="space-y-2">
          {policies.map((policy, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-white border border-orange-300 text-orange-700 rounded-full text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder={`मुद्दा क्रमांक ${idx + 1} प्रविष्ट करा...`}
                value={policy}
                onChange={(e) => handlePolicyChange(idx, e.target.value)}
                className="flex-1 p-2 text-sm border rounded-lg bg-white focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => handleRemovePolicy(idx)}
                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg text-sm"
                title="काढून टाका"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* "कृती आराखडा" Action Plan */}
      <div>
        <label className="block text-sm font-semibold text-gray-700">
          🎯 कृती आराखडा (Action Plan / Execution Strategy)
        </label>
        <textarea
          rows={3}
          placeholder="हा संकल्प पूर्ण करण्यासाठी प्रत्यक्षात कोणती कार्यवाही केली जाईल..."
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Status Switch */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActiveSwitch"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
        />
        <label htmlFor="isActiveSwitch" className="text-sm font-medium text-gray-700">
          सक्रिय ठेवा (Active in Mobile App)
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow"
        >
          सेव्ह करा (Save Resolution)
        </button>
      </div>
    </form>
  );
}
```

---

### B. Vanilla HTML + JavaScript (For Traditional Blade / PHP / jQuery Admin Panels)

```html
<!-- Dynamic Policy Point Repeater (HTML + JS) -->
<div class="form-group mb-4">
  <label class="form-label font-weight-bold">📋 माझे धोरण (Point to Point Options)</label>
  <div id="policiesContainer">
    <!-- Policy Row -->
    <div class="input-group mb-2 policy-row">
      <span class="input-group-text point-badge">1</span>
      <input type="text" name="policies[]" class="form-control" placeholder="धोरणाचा मुद्दा प्रविष्ट करा..." required>
      <button type="button" class="btn btn-outline-danger btn-remove-point" onclick="removePoint(this)">✕</button>
    </div>
  </div>
  <button type="button" class="btn btn-sm btn-outline-primary mt-1" onclick="addPoint()">
    + नवीन मुद्दा जोडा (Add Point)
  </button>
</div>

<script>
function updatePointBadges() {
  document.querySelectorAll('#policiesContainer .policy-row').forEach((row, idx) => {
    row.querySelector('.point-badge').textContent = idx + 1;
  });
}

function addPoint() {
  const container = document.getElementById('policiesContainer');
  const count = container.querySelectorAll('.policy-row').length + 1;
  const newRow = document.createElement('div');
  newRow.className = 'input-group mb-2 policy-row';
  newRow.innerHTML = `
    <span class="input-group-text point-badge">${count}</span>
    <input type="text" name="policies[]" class="form-control" placeholder="धोरणाचा मुद्दा प्रविष्ट करा..." required>
    <button type="button" class="btn btn-outline-danger btn-remove-point" onclick="removePoint(this)">✕</button>
  `;
  container.appendChild(newRow);
  updatePointBadges();
}

function removePoint(btn) {
  const rows = document.querySelectorAll('#policiesContainer .policy-row');
  if (rows.length > 1) {
    btn.closest('.policy-row').remove();
    updatePointBadges();
  } else {
    rows[0].querySelector('input').value = '';
  }
}
</script>
```

---

## 6. Backend Controller Implementation Example

### A. Node.js (Express + Multer)

```javascript
// resolutionController.js
const { v4: uuidv4 } = require("uuid");
const db = require("./db"); // Your database connection pool

exports.createResolution = async (req, res) => {
  try {
    const {
      sankalpNumber,
      title,
      shortTitle,
      category,
      sankalpStatement,
      actionPlan,
      iconName,
      isActive,
      policies,
    } = req.body;

    const id = `sankalp-${String(sankalpNumber).padStart(2, "0")}`;
    const logoUrl = req.file ? `/uploads/resolutions/${req.file.filename}` : null;
    const parsedPolicies = typeof policies === "string" ? JSON.parse(policies) : policies;

    // Insert into MySQL / PostgreSQL
    const sql = `
      INSERT INTO resolutions 
      (id, sankalp_number, title, short_title, logo_url, icon_name, category, sankalp_statement, action_plan, policies, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      id,
      parseInt(sankalpNumber, 10),
      title,
      shortTitle || null,
      logoUrl,
      iconName || "star",
      category || null,
      sankalpStatement,
      actionPlan || null,
      JSON.stringify(parsedPolicies || []),
      isActive === "1" || isActive === true ? 1 : 0,
    ]);

    return res.status(201).json({
      success: true,
      message: "Resolution created successfully",
      data: { id },
    });
  } catch (err) {
    console.error("Error creating resolution:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
```

---

### B. PHP (Laravel Controller)

```php
// ResolutionController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Resolution;

class ResolutionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sankalpNumber'    => 'required|integer|unique:resolutions,sankalp_number',
            'title'            => 'required|string|max:255',
            'shortTitle'       => 'nullable|string|max:100',
            'category'         => 'nullable|string|max:100',
            'sankalpStatement' => 'required|string',
            'actionPlan'       => 'nullable|string',
            'policies'         => 'required',
            'logo'             => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('resolutions', 'public');
            $logoUrl = asset('storage/' . $path);
        }

        $policiesArray = is_string($request->policies) 
            ? json_decode($request->policies, true) 
            : $request->policies;

        $resolution = Resolution::create([
            'id'                => 'sankalp-' . str_pad($validated['sankalpNumber'], 2, '0', STR_PAD_LEFT),
            'sankalp_number'    => $validated['sankalpNumber'],
            'title'             => $validated['title'],
            'short_title'       => $validated['shortTitle'],
            'category'          => $validated['category'],
            'logo_url'          => $logoUrl,
            'sankalp_statement' => $validated['sankalpStatement'],
            'action_plan'       => $validated['actionPlan'],
            'policies'          => $policiesArray,
            'is_active'         => $request->boolean('isActive', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'संकल्प यशस्वीरीत्या जतन केला.',
            'data'    => $resolution,
        ], 201);
    }
}
```

---

## 7. Migration & Testing Verification Checklist

- [ ] **Mobile App:** Click on any Home Page card -> navigates to `/resolution-detail?id=sankalp-XX`.
- [ ] **Mobile App:** Heading on details page matches the card heading.
- [ ] **Mobile App:** Point-to-point policies render with numbered badges (`१`, `२`, `३`...).
- [ ] **Mobile App:** "सर्व पहा →" button opens the full `/resolutions` list screen.
- [ ] **Admin Form:** Image upload generates proper image preview.
- [ ] **Admin Form:** `+ Add Point` button adds dynamic policy inputs.
- [ ] **Admin Form:** `✕` button removes a point and re-indexes the numbers.
- [ ] **API:** `GET /api/v1/resolutions` returns the updated JSON schema with `logoUrl`, `policies`, and `actionPlan`.
