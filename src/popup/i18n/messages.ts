export type Locale = 'en' | 'vi' | 'zh';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  vi: '🇻🇳',
  zh: '🇨🇳',
};

const messages: Record<Locale, Record<string, string>> = {
  en: {
    // Header
    'header.title': 'MD → Lark',
    'header.subtitle': 'Import Markdown to Docs',

    // Mode toggle
    'mode.upload': 'Upload File',
    'mode.paste': 'Paste Markdown',

    // Drop zone
    'drop.title': 'Drop .md file here',
    'drop.sub': 'or click to browse',

    // Paste zone
    'paste.placeholder': '# Paste your markdown here...\n\nWrite or paste markdown content, then use the buttons below.',
    'paste.fileName': 'pasted-content.md',

    // Action buttons
    'btn.preview': 'Preview',
    'btn.convert': 'Convert',
    'btn.export': 'Export to MD',
    'btn.clear': 'Clear',

    // Ready info
    'ready.ghost': 'No file selected',

    // Status
    'status.reading': 'Reading {fileName}...',
    'status.converting': 'Converting...',
    'status.insertSuccess': 'Inserted successfully!',
    'status.clipboardSuccess': 'Copied to clipboard!',
    'status.successSub': '{fileName} → Lark Docs',
    'status.clipboardHint': 'Click in your Lark document and press ⌘V to paste',
    'status.importAnother': 'Import Another',
    'status.tryAgain': 'Try Again',
    'status.downloadSuccess': 'Downloaded!',
    'status.downloadSub': '{fileName} saved',

    // Settings
    'settings.appearance': 'Appearance',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.system': 'Follow System',
    'settings.diagrams': 'Diagrams (PlantUML, Mermaid)',
    'settings.renderImage': 'Render as Image',
    'settings.keepCode': 'Keep as Code',
    'settings.firstLineTitle': 'First line as title',
    'settings.language': 'Language',

    // Footer & About
    'footer.text': 'MD → Lark Docs Converter',
    'about.desc': 'Convert Markdown files into beautiful Lark documents with one click. Supports diagrams, images, and more.',
    'about.feat1': 'Import .md files or paste directly',
    'about.feat2': 'Mermaid & PlantUML diagrams',
    'about.feat3': 'Auto-embed external images',
    'about.feat4': 'English, Tiếng Việt, 中文',
    'about.starCta': 'Star on GitHub to support us!',
    'about.report': 'Report Bug',
    'about.credits': 'Made with ❤️ — Open Source & Free Forever',
    'about.info': 'About',

    // Toast (background)
    'toast.title': 'Open a Lark document first',
    'toast.sub': 'Go to larksuite.com and open a doc, then click the extension again.',
  },

  vi: {
    'header.title': 'MD → Lark',
    'header.subtitle': 'Chuyển đổi Markdown sang Docs',

    'mode.upload': 'Tải file',
    'mode.paste': 'Dán Markdown',

    'drop.title': 'Kéo thả file .md vào đây',
    'drop.sub': 'hoặc nhấn để chọn file',

    'paste.placeholder': '# Dán markdown của bạn vào đây...\n\nViết hoặc dán nội dung markdown, sau đó dùng các nút bên dưới.',
    'paste.fileName': 'nội-dung-dán.md',

    'btn.preview': 'Xem trước',
    'btn.convert': 'Chuyển đổi',
    'btn.export': 'Xuất ra MD',
    'btn.clear': 'Xoá',

    'ready.ghost': 'Chưa chọn file',

    'status.reading': 'Đang đọc {fileName}...',
    'status.converting': 'Đang chuyển đổi...',
    'status.insertSuccess': 'Chèn thành công!',
    'status.clipboardSuccess': 'Đã sao chép!',
    'status.successSub': '{fileName} → Lark Docs',
    'status.clipboardHint': 'Nhấn vào tài liệu Lark và bấm ⌘V để dán',
    'status.importAnother': 'Nhập file khác',
    'status.tryAgain': 'Thử lại',
    'status.downloadSuccess': 'Đã tải xuống!',
    'status.downloadSub': 'Đã lưu {fileName}',

    'settings.appearance': 'Giao diện',
    'settings.light': 'Sáng',
    'settings.dark': 'Tối',
    'settings.system': 'Theo hệ thống',
    'settings.diagrams': 'Biểu đồ (PlantUML, Mermaid)',
    'settings.renderImage': 'Hiển thị ảnh',
    'settings.keepCode': 'Giữ mã nguồn',
    'settings.firstLineTitle': 'Dòng đầu làm tiêu đề',
    'settings.language': 'Ngôn ngữ',

    'footer.text': 'Chuyển đổi MD → Lark Docs',
    'about.desc': 'Chuyển đổi file Markdown thành tài liệu Lark chỉ với một cú nhấp. Hỗ trợ biểu đồ, hình ảnh và nhiều hơn nữa.',
    'about.feat1': 'Import file .md hoặc dán trực tiếp',
    'about.feat2': 'Biểu đồ Mermaid & PlantUML',
    'about.feat3': 'Tự động nhúng hình ảnh',
    'about.feat4': 'English, Tiếng Việt, 中文',
    'about.starCta': 'Cho sao trên GitHub để ủng hộ!',
    'about.report': 'Báo lỗi',
    'about.credits': 'Làm với ❤️ — Mã nguồn mở & Miễn phí mãi mãi',
    'about.info': 'Thông tin',

    'toast.title': 'Hãy mở tài liệu Lark trước',
    'toast.sub': 'Truy cập larksuite.com và mở một tài liệu, sau đó nhấn extension.',
  },

  zh: {
    'header.title': 'MD → Lark',
    'header.subtitle': '将Markdown导入文档',

    'mode.upload': '上传文件',
    'mode.paste': '粘贴Markdown',

    'drop.title': '拖拽 .md 文件到这里',
    'drop.sub': '或点击浏览',

    'paste.placeholder': '# 在此粘贴Markdown内容...\n\n编写或粘贴Markdown内容，然后使用下方按钮操作。',
    'paste.fileName': '粘贴内容.md',

    'btn.preview': '预览',
    'btn.convert': '转换',
    'btn.export': '导出MD',
    'btn.clear': '清除',

    'ready.ghost': '未选择文件',

    'status.reading': '正在读取 {fileName}...',
    'status.converting': '正在转换...',
    'status.insertSuccess': '插入成功！',
    'status.clipboardSuccess': '已复制到剪贴板！',
    'status.successSub': '{fileName} → Lark Docs',
    'status.clipboardHint': '点击Lark文档并按 ⌘V 粘贴',
    'status.importAnother': '导入其他文件',
    'status.tryAgain': '重试',
    'status.downloadSuccess': '已下载!',
    'status.downloadSub': '已保存 {fileName}',

    'settings.appearance': '外观',
    'settings.light': '浅色',
    'settings.dark': '深色',
    'settings.system': '跟随系统',
    'settings.diagrams': '图表 (PlantUML, Mermaid)',
    'settings.renderImage': '渲染为图片',
    'settings.keepCode': '保留代码',
    'settings.firstLineTitle': '首行作为标题',
    'settings.language': '语言',

    'footer.text': 'MD → Lark Docs 转换器',
    'about.desc': '一键将Markdown文件转换为精美的Lark文档。支持图表、图片等。',
    'about.feat1': '导入 .md 文件或直接粘贴',
    'about.feat2': 'Mermaid & PlantUML 图表',
    'about.feat3': '自动嵌入外部图片',
    'about.feat4': 'English, Tiếng Việt, 中文',
    'about.starCta': '在GitHub上给星支持我们！',
    'about.report': '报告错误',
    'about.credits': '用 ❤️ 制作 — 开源且永久免费',
    'about.info': '关于',

    'toast.title': '请先打开Lark文档',
    'toast.sub': '访问 larksuite.com 并打开文档，然后再点击扩展。',
  },
};

export default messages;
