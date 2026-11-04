# IELTS Vocab Master

Ứng dụng học từ vựng tiếng Việt chạy bằng **HTML, CSS và JavaScript thuần**, không có framework, backend hay thư viện runtime. Giao diện tối dùng các biến màu có sẵn trong `style.css`. Bộ từ cũ, flashcards, gõ từ, phát âm trình duyệt và tiến độ cũ vẫn được giữ lại.

## Chạy ứng dụng

Mở trực tiếp `index.html` bằng trình duyệt hiện đại, hoặc dùng Node.js 22.13+ (đã kiểm tra với Node 24):

```sh
npm ci
npm start
```

Truy cập **http://127.0.0.1:4173**. Server chỉ dùng để phát triển trên máy cá nhân. Chọn **A1–B1** trên thanh điều hướng hoặc nút trên trang chủ. Chạy qua HTTP giúp localStorage có origin ổn định; tiến độ của file trực tiếp và địa chỉ HTTP không dùng chung. Google Fonts cần mạng; khi offline ứng dụng dùng phông sans-serif dự phòng.

## Học từ vựng A1–B1

- Tìm từ tiếng Anh hoặc nghĩa tiếng Việt, có hoặc không có dấu.
- Kết hợp bộ lọc chủ đề, CEFR, kỹ năng và trạng thái; phân trang 12 từ.
- Flashcards: xem từ/IPA, hiện nghĩa và ví dụ, chọn **Chưa học / Đã học / Cần ôn tập**, hoặc bỏ qua.
- Quiz: tối đa 10 từ ngẫu nhiên từ kết quả lọc, mỗi câu 4 nghĩa Việt khác nhau. Đáp án nhiễu lấy từ toàn bộ thư viện để vẫn học được khi chỉ lọc một từ. Chỉ chấm một lần mỗi câu; trả lời sai chuyển từ sang cần ôn tập. Đúng quiz không tự đánh dấu đã học.
- Tiến độ hiển thị toàn bộ thư viện và số từ trong bộ lọc. Lưu theo ID ổn định trong `ielts_a1_b1_progress_v1`, độc lập với `ielts_progress` của bộ cũ; không thay đổi hay nhập ngầm tiến độ cũ. Đồng bộ giữa các tab cùng origin, chưa đồng bộ tài khoản/thiết bị. Nếu localStorage bị chặn, ứng dụng báo và giữ tiến độ trong bộ nhớ phiên.
- **Tải CSV / Tải JSON** xuất toàn bộ kết quả lọc (mọi trang), gồm dữ liệu học và tham chiếu CEFR; không chứa tiến độ cá nhân. CSV UTF-8 có BOM để đọc tiếng Việt trong Excel, escape dấu nháy/dòng mới và chống công thức trong ô. JSON giữ danh sách chủ đề và nguồn.
- Dialog học hỗ trợ bàn phím, nút Đóng và Escape; giao diện co giãn cho điện thoại, có nhãn form, focus và thông báo trạng thái.

## Dữ liệu và nguồn

Bản đầu có **78 mục từ**, **26 chủ đề**, gồm **25 A1, 29 A2, 24 B1**. Đây là bộ nền tảng chọn lọc, ba từ mỗi chủ đề, không phải toàn bộ từ vựng A1–B1 hoặc khóa IELTS hoàn chỉnh. Không dùng dữ liệu lặp hay mẫu giả để tăng số lượng.

Chủ đề: Education, Family, Work, Health, Environment, Technology, Travel, Food, Daily Life, Shopping, Transport, Society, Culture, Housing, Weather, Sport, Media, Money, Cities, Nature, Science, Communication, Arts, Clothing, Time, Data and Trends.

CEFR đối chiếu **headword + từ loại** trong [Oxford 3000 by CEFR level, British English](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf), ngày 05/11/2026. Mỗi mục có `cefrSource` ghi nguồn, trang PDF (đếm từ 1), headword và từ loại để kiểm tra lại. Ví dụ: `student` (n.) A1 trang 3, `degree` (n.) A2 trang 5, `assignment` (n.) B1 trang 7. Không tự suy ra CEFR từ độ dài hoặc chủ đề của từ.

IPA dùng cách phát âm Anh–Anh; nghĩa Việt, câu ví dụ, bản dịch, collocations và nhãn kỹ năng do dự án biên soạn, không sao chép ví dụ từ điển. Nguồn CEFR không xác nhận riêng mọi nghĩa, IPA, ví dụ hay nhãn kỹ năng. Cần thẩm định ngôn ngữ khi mở rộng dữ liệu; kiểm tra tự động không chứng minh độ chính xác ngữ nghĩa. CEFR của từ không đại diện cho độ khó của toàn bộ câu, và không tương đương trực tiếp với band IELTS.

Nhãn kỹ năng là gợi ý sư phạm, không phải tần suất đo từ corpus IELTS hay phân loại chính thức:

| Kỹ năng | Mục tiêu |
| --- | --- |
| Listening | Hội thoại, chỉ đường, lịch trình, thông báo, đời sống |
| Speaking | Chủ đề Part 1, kể trải nghiệm Part 2, thảo luận Part 3 |
| Reading | Hiểu từ trong văn bản thông dụng và bài đọc |
| Writing | Diễn đạt ý trong Task 2; chủ đề Data and Trends cho Task 1 |

File `IELTS_Vocabulary_A1_B1_Full.csv` có sẵn tại workspace chưa được Git theo dõi. Thay đổi này không chỉnh sửa, commit hoặc nhập tự động file đó vì thiếu IPA, ví dụ và dẫn nguồn CEFR. Bộ `vocab-data.js` cũ cũng không được gán CEFR hồi tố.

## Cấu trúc và mở rộng

| File | Vai trò |
| --- | --- |
| `index.html`, `style.css`, `app.js` | Giao diện và chế độ học cũ, tích hợp mục mới |
| `data/vocabulary.json` | Dữ liệu chuẩn duy nhất để biên tập |
| `vocab-a1-b1-data.js` | Bản sinh từ JSON, hỗ trợ mở trực tiếp bằng `file://` |
| `vocab-core.js` | Lọc/tìm kiếm, trạng thái, quiz, CSV; dùng chung browser và test |
| `vocabulary.js`, `vocabulary.css` | Điều khiển và giao diện học A1–B1 |
| `scripts/build.cjs`, `scripts/serve.cjs` | Sinh dữ liệu trình duyệt và server phát triển |
| `tests/`, `playwright.config.cjs`, `eslint.config.cjs` | Kiểm tra dữ liệu, logic, tích hợp và lint |

Mỗi mục gồm `id`, `word`, `ipa`, `pos`, `meaningVi`, `cefr`, `exampleEn`, `exampleVi`, `collocations[]`, `topics[]`, `skills[]`, `cefrSource`. Không đổi ID sau khi phát hành vì tiến độ tham chiếu ID. Tái sử dụng một mục với nhiều `topics`/`skills` thay vì nhân bản. Khi thêm nghĩa khác cần ID riêng và kiểm chứng CEFR tương ứng; validator hiện chặn trùng headword + từ loại, nên chỉ mở rộng quy tắc này khi có phân biệt nghĩa rõ ràng.

Thêm mục vào JSON, kiểm tra nghĩa/IPA/collocations, ghi nguồn và trang, rồi chạy build và các kiểm tra. Không biên tập trực tiếp file JS được sinh. Nếu thay đổi số lượng từ, cập nhật phần giới thiệu trong HTML/README và các assertion tổng số trong test.

## Kiểm tra

```sh
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:browser
```

Build sinh script dữ liệu (không bundle ứng dụng). Lint dùng ESLint và kiểm tra bản sinh đồng bộ với JSON. Test gồm 5 kiểm tra Node cho dữ liệu đầy đủ/ID/nguồn, lọc không dấu, trạng thái lỗi, đáp án quiz và CSV; 12 lượt kiểm tra Playwright trên Chromium desktop và viewport iPhone 13 cho bộ lọc, lưu tiến độ, hoàn thành/học lại, xuất file, hồi quy chế độ cũ và localStorage bị hỏng/bị chặn. Mobile được mô phỏng trên Chromium, chưa phải kiểm tra Safari hoặc thiết bị thật.

Dependencies chỉ phục vụ phát triển. Các tệp tài liệu học tập và dữ liệu cũ không cần thiết cho build, không bị sửa. Có thể triển khai các tệp HTML/CSS/JS tĩnh bằng hệ thống hosting hiện có; không cần chạy Node trong môi trường sản phẩm.
