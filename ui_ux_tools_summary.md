# Tổng hợp công cụ UI/UX & Landing Page Workflow

> Mục tiêu: gom các website bạn đưa thành một danh sách tra cứu nhanh để dùng khi thiết kế UI/UX, landing page, vibe design và triển khai giao diện bằng React/Tailwind.

## Bảng tổng hợp nhanh

| # | Công cụ | Link | Chức năng ngắn | Nên dùng khi |
|---:|---|---|---|---|
| 1 | **DesignMD** | <https://designmd.me/> | Tạo file `DESIGN.md` từ một URL bất kỳ; trích xuất design system như màu sắc, typography, tokens và pattern component từ website tham chiếu. | Muốn học/copy tinh thần thiết kế của một website đẹp rồi đưa cho AI coding assistant làm theo style đó. |
| 2 | **get design.md – Composio DESIGN.md** | <https://getdesign.md/composio/design-md> | Thư viện/case study `DESIGN.md`; trang Composio là một bản phân tích design system có thể tải/cài vào project bằng CLI để AI assistant dùng khi làm UI. | Muốn lấy nhanh một style guide có sẵn cho AI code UI, đặc biệt với landing page/dev tool/dark SaaS. |
| 3 | **Google Stitch** | <https://stitch.withgoogle.com/> | Công cụ AI của Google để tạo UI web/mobile high-fidelity từ prompt, hình ảnh, text hoặc code; hỗ trợ canvas thiết kế, prototype flow và xuất sang tool dev/design. | Muốn biến ý tưởng, wireframe hoặc mô tả sản phẩm thành prototype UI nhanh. |
| 4 | **YouMind** | <https://youmind.com/> | AI creation studio để thu thập ý tưởng, phát triển nội dung và tạo sản phẩm như bài viết, slide, hình ảnh, video, webpage. | Muốn làm moodboard, concept, nội dung landing page, slide pitch hoặc webpage từ các ý tưởng rời rạc. |
| 5 | **MotionSites** | <https://motionsites.ai/> | Thư viện prompt website/hero/animation cao cấp cho các AI website builder như Lovable, Bolt, Cursor, Claude. | Muốn có prompt landing page đẹp, hero section ấn tượng, animated background, gradient hoặc motion style. |
| 6 | **21st.dev Community Components** | <https://21st.dev/community/components> | Kho component cộng đồng cho marketing blocks và UI components: hero, CTA, pricing, feature, testimonial, button, input, AI chat, card, table, tabs, v.v. | Muốn tìm nhanh block/component đẹp để học layout hoặc đưa vào project React/Tailwind. |
| 7 | **Magic UI** | <https://magicui.design/> | Thư viện component/effect mã nguồn mở cho React, TypeScript, Tailwind CSS và Motion; tập trung vào landing page, marketing UI và hiệu ứng đẹp. | Muốn thêm các hiệu ứng polished như animated text, bento grid, aurora text, particles, marquee, border beam, hero video. |
| 8 | **React Bits** | <https://reactbits.dev/get-started/index> | Bộ component React animated, interactive và customizable; gồm text animation, backgrounds, UI elements và creative tools. | Muốn làm giao diện nổi bật hơn bằng animation, background động, text effect hoặc component copy-paste nhanh. |

---

## Phân loại theo workflow thiết kế

### 1. Lấy cảm hứng và tạo design system

- **DesignMD**: dùng khi có một website mẫu đẹp và muốn chuyển style của nó thành `DESIGN.md` để AI hiểu màu, font, spacing, component pattern.
- **get design.md**: dùng như thư viện style guide có sẵn. Thay vì tự phân tích từ đầu, có thể chọn một phong cách gần với sản phẩm cần làm.

### 2. Tạo concept, nội dung và prototype

- **Google Stitch**: phù hợp nhất để đi từ prompt/wireframe sang UI prototype.
- **YouMind**: phù hợp để gom research, viết copy, tạo moodboard, slide, nội dung marketing và thử nhiều concept sáng tạo.
- **MotionSites**: phù hợp để lấy prompt thiết kế landing page/hero section có tính “wow” cao.

### 3. Tìm block và component để triển khai

- **21st.dev**: dùng để tìm block theo mục đích landing page: hero, feature, CTA, pricing, testimonial, footer, AI chat, v.v.
- **Magic UI**: dùng khi muốn landing page có motion/visual polish nhưng vẫn giữ code React/Tailwind rõ ràng.
- **React Bits**: dùng khi muốn animation nổi bật, background động, text effect hoặc component UI tương tác.

---

## Cách dùng thực tế cho một landing page

### Bước 1: Chọn style tham chiếu

Dùng **DesignMD** hoặc **get design.md** để tạo/nhặt `DESIGN.md` cho style mong muốn.

Ví dụ:

```text
Style mong muốn: clean academic-tech, blue/white palette, minimalist cards, polished research center website.
```

### Bước 2: Sinh concept/prototype

Dùng **Google Stitch** hoặc **YouMind** để tạo bản prototype đầu tiên.

Prompt mẫu:

```text
Design a minimalist landing page for an AI Research and Application Center at a university. Use a clean academic-tech visual style, blue and white palette, strong hero section, research group cards, partnership section, student lab section, and contact map.
```

### Bước 3: Nâng cấp hero và motion

Dùng **MotionSites** để lấy ý tưởng prompt cho hero, animation hoặc visual style.

Nên ưu tiên:

- Hero có visual rõ ràng.
- CTA nổi bật.
- Motion vừa đủ, không làm rối nội dung.
- Không dùng quá nhiều glow/gradient nếu trang cần cảm giác học thuật, uy tín.

### Bước 4: Triển khai bằng component

Dùng **21st.dev**, **Magic UI**, **React Bits** để chọn component phù hợp:

- Hero section: 21st.dev / Magic UI
- Bento grid: Magic UI
- Animated text: Magic UI / React Bits
- CTA button: 21st.dev / Magic UI
- Background effect: React Bits / Magic UI
- Testimonial/pricing/footer: 21st.dev

### Bước 5: Kiểm tra lại tính nhất quán

Trước khi chốt UI, kiểm tra:

```text
[ ] Có đúng brand/style không?
[ ] Typography có nhất quán không?
[ ] Spacing có đều không?
[ ] Button/CTA có rõ không?
[ ] Motion có phục vụ nội dung không?
[ ] Mobile có còn đẹp không?
[ ] Component có bị quá “template” không?
```

---

## Gợi ý stack nếu bạn code bằng React/Tailwind

```text
Next.js / Vite React
Tailwind CSS
shadcn/ui
Magic UI
React Bits
21st.dev blocks
Framer Motion / Motion
Lucide React icons
```

### Workflow khuyến nghị

```text
Reference website → DesignMD / getdesign.md → DESIGN.md
DESIGN.md + prompt → Stitch / YouMind → prototype
Prototype → Cursor / Claude / Lovable / Bolt → code
Components → 21st.dev / Magic UI / React Bits → polish UI
```

---

## Ghi chú sử dụng

- **DesignMD / getdesign.md** phù hợp cho giai đoạn định hình style.
- **Stitch / YouMind** phù hợp cho giai đoạn tạo ý tưởng và prototype.
- **MotionSites** phù hợp khi muốn prompt landing page đẹp hơn, có vibe/motion rõ hơn.
- **21st.dev / Magic UI / React Bits** phù hợp cho giai đoạn triển khai giao diện thật.

Không nên lạm dụng quá nhiều thư viện animation cùng lúc. Một landing page đẹp thường chỉ cần 1–2 hiệu ứng chủ đạo, còn lại nên tập trung vào message, hierarchy, spacing và CTA.

---

## Nguồn/link gốc

- DesignMD: <https://designmd.me/>
- get design.md – Composio: <https://getdesign.md/composio/design-md>
- Google Stitch: <https://stitch.withgoogle.com/>
- YouMind: <https://youmind.com/>
- MotionSites: <https://motionsites.ai/>
- 21st.dev Community Components: <https://21st.dev/community/components>
- Magic UI: <https://magicui.design/>
- React Bits: <https://reactbits.dev/get-started/index>
