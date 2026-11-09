# Grestate valuation v2

## Chạy local

Từ thư mục gốc repository:

```powershell
python -m pip install -r valuation-service/requirements.txt
python -m uvicorn app:app --app-dir valuation-service --host 127.0.0.1 --port 8000 --workers 1
```

Chạy backend Node như bình thường (`npm run dev` trong `backend`), frontend bằng
`npm run dev` trong `frontend`, đăng nhập và mở `/predict`.
Frontend dùng `VITE_API_URL` hiện có → `/api/valuation/*` của backend có xác thực
→ FastAPI nội bộ. Không dùng `VITE_VALUATION_API_URL` hoặc proxy Vite cũ nữa.
Sau khi cập nhật hoặc train lại, khởi động lại FastAPI để nạp phiên bản đang chọn.

## Huấn luyện và chọn model

```powershell
python -m pip install -r valuation-service/requirements-train.txt
python -B -u valuation-service/build_model.py --jobs 4
```

Mặc định đọc cache Hugging Face trên máy và lọc Đà Nẵng bằng Arrow trước khi tạo
DataFrame. Có thể dùng `--cache-dir PATH`; chỉ dùng `--download` khi muốn tải hoặc
cập nhật dataset. Script không tải dữ liệu hoặc train khi khởi động API.

- Loại chiều sâu hoàn toàn khỏi đầu vào và đặc trưng.
- Chuẩn hóa danh mục/tiện ích dùng chung trong `features.py`.
- Chỉ giữ lần đăng mới nhất trong nhóm cùng tiêu đề, địa chỉ, loại và diện tích.
  Đây là heuristic nhận diện tin đăng lại, không phải định danh pháp lý tài sản.
- Lọc theo phạm vi cố định: 25–1200 m², 0,4–80 tỷ, 5–320 triệu/m².
- Chia theo thời gian thành train / validation / calibration / test (60/15/10/15%
  số ngày; số bản ghi mỗi tập có thể khác tỷ lệ này).
- Mỗi model có bộ preprocessing riêng. So sánh Ridge, Random Forest, XGBoost.
- Chọn **MAPE validation thấp nhất**, MAE thấp hơn nếu hòa. Không chọn theo test.
- Fit lại model thắng trên train + validation; calibration chỉ hiệu chỉnh khoảng
  giá; test chỉ đánh giá cuối, không tham gia chọn/refit model.
- Khoảng giá dùng split conformal trên sai số log, mục tiêu bao phủ 90%, theo loại
  BĐS nếu có đủ mẫu. Báo độ bao phủ test thực tế; thay đổi thị trường có thể làm
  mức bao phủ thực tế khác mục tiêu.

Mỗi lần train tạo `artifacts/<version>/` gồm model, metadata, metrics, calibration,
manifest. Model được nạp lại và đối chiếu dự đoán trước khi atomically đổi
`artifacts/current.json`. API kiểm tra checksum, schema và phiên bản thư viện trước khi nạp. Hash code được chuẩn hóa newline để chạy được cả Windows và Linux.
`model_metrics.json` ở thư mục gốc là bản sao báo cáo để dễ xem trong IDE;
API đọc báo cáo trong artifact đang chọn.

## Phạm vi và dữ liệu thiếu

Các trường nhập/chọn trên form là bắt buộc, ngoại trừ mô tả tiện ích.
Tiện ích có thể để trống hoặc không gửi; API mặc định thành chuỗi rỗng và vẫn
giới hạn tối đa 4.000 ký tự. Các trường bắt buộc từ chối thiếu, null hoặc chuỗi trống.
Pháp lý/hướng cần được chọn rõ ràng; vẫn có thể chủ động chọn “Không rõ”. Tỉnh/thành
được điền sẵn. Khi chọn đất, các trường phòng/tầng được ẩn và gửi 0 tự động.
API kiểm tra danh mục và các giới hạn số. Không nhận trường `length`.
Dữ liệu train chưa có GPS từng tài sản nên model không dùng lat/lon và khoảng
cách làm đặc trưng. Ghim chỉ phục vụ khoảng cách tham khảo. Phạm vi bản đồ là
bounding box rộng của khu vực, không thay thế kiểm tra đa giác địa giới; người dùng
cần xác nhận quận/phường phù hợp với ghim. Danh mục dùng địa chỉ cũ theo dataset.

## API và vận hành

Backend:
- `VALUATION_SERVICE_URL`: mặc định `http://127.0.0.1:8000`.
- `VALUATION_SERVICE_TOKEN`: tùy chọn; đặt cùng giá trị trong FastAPI và Node khi
  hai dịch vụ giao tiếp qua mạng riêng. Không đưa token này vào frontend.

FastAPI:
- Chỉ bind loopback/private network; không công khai trực tiếp cổng 8000.
- Chạy **một worker** với geocoder công khai để giới hạn tổng tần suất trong tiến trình.
- `GEOCODER_URL`: đổi nhà cung cấp hỗ trợ search/reverse theo định dạng Nominatim.
- `GEOCODER_USER_AGENT`: định danh ứng dụng, nên kèm địa chỉ liên hệ khi triển khai.

Geocoder có timeout 8 giây, cache trong bộ nhớ 24 giờ (tối đa 2000 mục), tối thiểu
1,1 giây giữa các request. Cache mất khi khởi động lại. Khi chạy nhiều instance,
phải dùng cache/rate limit chung hoặc nhà cung cấp phù hợp.
Chính sách dịch vụ công khai: https://operations.osmfoundation.org/policies/nominatim/
(giới hạn tối đa 1 request/giây trên toàn ứng dụng, định danh ứng dụng và attribution).

Node giới hạn theo tài khoản: 12 lần dự đoán/phút, 60 request metadata/địa chỉ/phút.
Giới hạn hiện trong bộ nhớ mỗi instance; deployment nhiều instance cần kho dùng chung.
API inference chạy ở threadpool, tối đa 2 dự đoán đồng thời, model dùng 2 threads.

## Kiểm tra

```powershell
python -B -m unittest discover -s valuation-service/tests -v
npm --prefix frontend run build
node --test backend/tests/valuation.route.test.js
```

Kiểm tra UI: chọn quận/phường, nhập đường, bấm tìm vị trí hoặc ghim, nhập diện tích
và loại BĐS, điền đầy đủ các trường rồi gửi dự đoán. Thay đổi đầu vào phải xóa
kết quả cũ. Khi đang gửi, form và ghim bị khóa. Tên đường tra ngược là gợi ý cần
người dùng chọn, không tự ghi đè địa chỉ đang nhập.

Các file `.pkl` và JSON danh mục cũ ở thư mục gốc không còn được API sử dụng. Khi chuyển máy/deploy, cần chuyển cả thư mục artifact đang chọn (file model binary được gitignore) hoặc chạy train lại.
