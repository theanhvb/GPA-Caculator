# Prompt: Xây dựng Website Tính GPA & Định Hướng Xếp Loại Bằng

## 1. Tổng quan sản phẩm

Xây dựng một web app cho phép sinh viên:
- Nhập danh sách môn học (điểm, tín chỉ, độ khó) theo từng học kỳ
- Xem GPA hiện tại theo thang 10 và thang 4
- Chọn xếp loại bằng mục tiêu (Trung bình → Khá → Giỏi → Xuất sắc)
- Biết cần đạt điểm trung bình bao nhiêu ở các kỳ còn lại để đạt mục tiêu
- Nhận gợi ý nên cải thiện (học lại) môn nào để tăng GPA hiệu quả nhất

Ứng dụng chạy hoàn toàn phía client (không bắt buộc backend), lưu dữ liệu bằng localStorage/IndexedDB.

## 2. Luồng dữ liệu & các trường nhập liệu

Mỗi môn học cần các trường sau (đây là điểm khác với ý tưởng gốc — bổ sung 2 trường quan trọng để công thức tính đúng):

| Trường | Kiểu | Ghi chú |
|---|---|---|
| Mã môn / Tên môn | text | ít nhất 1 trong 2 |
| Học kỳ | select/text | VD "HK1 2024-2025" — bắt buộc, để nhóm theo kỳ |
| Điểm (thang 10) | number 0–10 | có thể cho nhập thang 4 hoặc điểm chữ, tự quy đổi |
| Số tín chỉ | number > 0 | |
| Độ khó (1–5) | select | 1 = rất dễ, 5 = rất khó |
| Trạng thái | enum | `đã học` / `dự kiến` — bắt buộc để tách môn đã có điểm thật khỏi môn giả định |
| Lần học lại? | boolean + link tới mã môn gốc (tùy chọn) | nếu học lại, hỏi người dùng: tính điểm nào vào GPA — điểm mới nhất hay điểm cao nhất |

Validate: điểm 0–10, tín chỉ > 0 và là số nguyên hoặc bội số hợp lệ theo trường, độ khó 1–5, không được để trống mã/tên môn.

## 3. Công thức tính toán

### 3.1 GPA thang 10
```
GPA_10 = Σ(điểm_i × tín_chỉ_i) / Σ(tín_chỉ_i)   [chỉ tính môn "đã học"]
```

### 3.2 Quy đổi sang thang 4
Bảng quy đổi mặc định (cho phép người dùng chỉnh sửa trong phần Cài đặt vì mỗi trường áp dụng khác nhau):

| Thang 10 | Thang 4 | Xếp loại chữ |
|---|---|---|
| 8.5 – 10 | 4.0 | A |
| 8.0 – 8.4 | 3.5 | B+ |
| 7.0 – 7.9 | 3.0 | B |
| 6.5 – 6.9 | 2.5 | C+ |
| 5.5 – 6.4 | 2.0 | C |
| 5.0 – 5.4 | 1.5 | D+ |
| 4.0 – 4.9 | 1.0 | D |
| < 4.0 | 0.0 | F |

Tính GPA_4 bằng cách quy đổi từng môn rồi weighted-average theo tín chỉ (không quy đổi từ GPA_10 trung bình cuối cùng, vì sẽ sai số).

### 3.3 Ngưỡng xếp loại bằng (configurable, có default)
Mặc định theo thang 4:
- Xuất sắc: 3.6 – 4.0
- Giỏi: 3.2 – 3.59
- Khá: 2.5 – 3.19
- Trung bình: 2.0 – 2.49

Cho phép người dùng đổi sang xếp theo thang 10 nếu trường họ quy định vậy, và tự sửa số nếu trường có ngưỡng riêng.

### 3.4 Điểm cần đạt các kỳ còn lại
Cần thêm input: **tổng số tín chỉ toàn khóa** (hoặc **số tín chỉ còn lại**).

```
tín_chỉ_đã_học = Σ tín_chỉ các môn "đã học"
tín_chỉ_còn_lại = tổng_tín_chỉ_toàn_khóa − tín_chỉ_đã_học
GPA_cần_TB_còn_lại = (GPA_target × tổng_tín_chỉ_toàn_khóa − GPA_hiện_tại × tín_chỉ_đã_học) / tín_chỉ_còn_lại
```
Tính riêng cho cả thang 10 và thang 4.

Xử lý edge case:
- Nếu `tín_chỉ_còn_lại ≤ 0` → báo "đã hoàn thành toàn bộ tín chỉ, không thể thay đổi GPA nữa"
- Nếu kết quả > 10 (hoặc > 4) → cảnh báo "mục tiêu không khả thi với số tín chỉ còn lại" và gợi ý mục tiêu thấp hơn hoặc khuyên cải thiện điểm cũ (xem mục 3.5)
- Nếu kết quả ≤ điểm hiện tại hoặc âm → báo "bạn đã đạt mục tiêu này rồi"

### 3.5 Gợi ý môn nên cải thiện (học lại)
Chỉ xét môn "đã học" có điểm < 8. Tính điểm ưu tiên (impact score) cho từng môn:

```
impact_score = (8 − điểm_hiện_tại) × tín_chỉ / độ_khó
```

Sắp xếp giảm dần theo `impact_score` → môn đứng đầu là môn "dễ cải thiện + tín chỉ cao + đang kéo GPA xuống nhiều nhất" → nên ưu tiên học lại trước.

Với mỗi môn gợi ý, hiển thị thêm: nếu nâng điểm môn này lên 8.0, GPA thang 10 và thang 4 sẽ tăng thêm bao nhiêu (tính lại theo công thức 3.1/3.2 với điểm giả định = 8).

## 4. Yêu cầu giao diện

- Trang nhập liệu: form thêm môn học (dùng bảng có thể inline-edit và xóa từng dòng), nhóm hiển thị theo học kỳ
- Trang tổng quan: hiển thị GPA_10, GPA_4, xếp loại hiện tại (badge màu), biểu đồ GPA theo từng kỳ (line chart)
- Khối "Mục tiêu": dropdown chọn xếp loại target (thấp → cao), hiển thị điểm cần đạt các kỳ còn lại, có cảnh báo nếu không khả thi
- Khối "Gợi ý cải thiện": danh sách môn ưu tiên kèm điểm impact và GPA dự kiến nếu cải thiện
- Trang Cài đặt: chỉnh bảng quy đổi thang điểm, chỉnh ngưỡng xếp loại, nhập/sửa tổng tín chỉ toàn khóa
- Responsive, dùng được tốt trên mobile (sinh viên hay tra trên điện thoại)
- Toàn bộ dữ liệu lưu localStorage, có nút Export/Import (JSON hoặc CSV) để không mất dữ liệu khi đổi máy/xóa cache

## 5. Yêu cầu kỹ thuật

- Framework: React + Vite (hoặc Next.js nếu muốn dễ deploy lên Vercel)
- Styling: Tailwind CSS
- Biểu đồ: Recharts
- State: React state/context, không cần Redux vì scope nhỏ
- Lưu trữ: localStorage (dùng thư viện nhỏ như `idb-keyval` nếu cần IndexedDB cho dữ liệu lớn hơn)
- Không bắt buộc backend/database ở bản đầu — chỉ cần nếu về sau muốn đồng bộ nhiều thiết bị hoặc có tài khoản
- Deploy: Vercel hoặc Netlify (free tier đủ dùng)

## 6. Edge case bắt buộc xử lý

- Chưa nhập môn nào → không tính GPA, hiển thị trạng thái rỗng thân thiện
- Tất cả tín chỉ = 0 → tránh chia cho 0
- Nhập điểm ngoài khoảng 0–10 → chặn và báo lỗi ngay khi nhập
- Môn trùng mã (học lại) → hỏi rõ dùng điểm nào tính GPA, không tự động cộng dồn tín chỉ 2 lần
- Target thấp hơn xếp loại hiện tại → báo "đã đạt mục tiêu"
- Sửa/xóa môn học phải cập nhật lại toàn bộ tính toán ngay lập tức (real-time)
