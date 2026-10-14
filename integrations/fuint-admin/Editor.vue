<template>
  <div>
    <input ref="upload" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/bmp" hidden @change="uploadSelectedImage" />
    <div ref="editor" :style="styles"></div>
    <small v-if="uploading" role="status">图片上传中，请稍候…</small>
  </div>
</template>

<script>
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import { getToken } from '@/utils/auth'
import { mediaUrl, mediaHtml } from '@/utils/content-media'

const Delta = Quill.import('delta')
const BlockEmbed = Quill.import('blots/block/embed')

// Match actual videos; registering DIV as a video breaks ordinary HTML paste.
class VideoBlot extends BlockEmbed {
  static create(url) {
    const node = super.create()
    node.setAttribute('src', mediaUrl(url))
    node.setAttribute('controls', '')
    node.setAttribute('playsinline', '')
    return node
  }
  static value(node) { return node.getAttribute('src') || '' }
}
VideoBlot.blotName = 'customVideo'
VideoBlot.tagName = 'VIDEO'
Quill.register(VideoBlot, true)

export default {
  name: 'Editor',
  props: {
    value: { type: String, default: '' },
    height: { type: Number, default: null },
    minHeight: { type: Number, default: null },
    readOnly: { type: Boolean, default: false },
    fileSize: { type: Number, default: 5 },
    type: { type: String, default: 'url' },
  },
  data() {
    return { currentValue: '', uploading: false, uploadRange: null }
  },
  computed: {
    styles() {
      return { minHeight: this.minHeight ? `${this.minHeight}px` : undefined, height: this.height ? `${this.height}px` : undefined }
    },
  },
  watch: {
    value(value) {
      const html = mediaHtml(value)
      if (this.Quill && html !== this.currentValue) this.Quill.clipboard.dangerouslyPasteHTML(html)
    },
    readOnly(value) { if (this.Quill) this.Quill.enable(!value) },
    uploading(value) { this.$emit('upload-state', value) },
  },
  mounted() {
    this.Quill = new Quill(this.$refs.editor, {
      theme: 'snow', readOnly: this.readOnly, placeholder: '请输入内容，可直接粘贴文字或图片',
      modules: { toolbar: [
        ['bold', 'italic', 'underline', 'strike'], ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }], [{ indent: '-1' }, { indent: '+1' }],
        [{ size: ['small', false, 'large', 'huge'] }], [{ header: [1, 2, 3, false] }],
        [{ color: [] }, { background: [] }], [{ align: [] }], ['link', 'image'], ['clean'],
      ] },
    })
    this.Quill.clipboard.dangerouslyPasteHTML(mediaHtml(this.value))
    this.currentValue = this.Quill.root.innerHTML
    this.Quill.getModule('toolbar').addHandler('image', () => {
      if (this.readOnly || this.uploading) return
      this.uploadRange = this.range()
      this.$refs.upload.click()
    })
    // Capture before Quill's default handler to avoid duplicate insertion and focus races.
    this.Quill.root.addEventListener('paste', this.handlePaste, true)
    this.Quill.on('text-change', (delta, oldDelta, source) => {
      this.currentValue = this.Quill.root.innerHTML
      this.$emit('input', this.currentValue)
      this.$emit('on-change', { html: this.currentValue, text: this.Quill.getText(), quill: this.Quill })
      this.$emit('on-text-change', delta, oldDelta, source)
    })
    this.Quill.on('selection-change', (...args) => this.$emit('on-selection-change', ...args))
    this.Quill.on('editor-change', (...args) => this.$emit('on-editor-change', ...args))
  },
  beforeDestroy() {
    this.destroyed = true
    if (this.Quill) this.Quill.root.removeEventListener('paste', this.handlePaste, true)
    this.Quill = null
  },
  methods: {
    range() { return this.Quill.getSelection() || { index: Math.max(0, this.Quill.getLength() - 1), length: 0 } },
    handlePaste(event) {
      if (this.readOnly || !this.Quill) return
      const clipboard = event.clipboardData
      if (!clipboard) return
      const image = Array.from(clipboard.files || []).find(file => file.type.startsWith('image/'))
      const html = clipboard.getData('text/html')
      const text = clipboard.getData('text/plain')
      if (!image && !html && !text) return
      event.preventDefault()
      event.stopImmediatePropagation()
      const range = this.range()
      if (image) { this.uploadImage(image, range); return }
      let contents
      try { contents = html ? this.Quill.clipboard.convert(mediaHtml(html)) : new Delta().insert(text) }
      catch (_) { contents = new Delta().insert(text) }
      this.Quill.updateContents(new Delta().retain(range.index).delete(range.length).concat(contents), 'user')
      this.Quill.setSelection(range.index + contents.length(), 0, 'silent')
    },
    uploadSelectedImage(event) {
      const file = event.target.files[0]
      if (file) this.uploadImage(file, this.uploadRange || this.range())
      event.target.value = ''
    },
    async uploadImage(file, range) {
      if (this.readOnly || this.uploading) return
      if (!/^image\/(png|jpeg|gif|webp|bmp)$/.test(file.type)) { this.$message.error('请上传 PNG、JPG、GIF、WebP 或 BMP 图片'); return }
      if (file.size > Math.min(this.fileSize, 5) * 1024 * 1024) { this.$message.error('图片大小不能超过 5MB'); return }
      this.uploading = true
      const data = new FormData()
      data.append('file', file)
      try {
        const response = await fetch(process.env.VUE_APP_SERVER_URL + 'backendApi/file/upload', {
          method: 'POST', headers: { 'Access-Token': getToken(), 'ngrok-skip-browser-warning': 'true' }, body: data,
        })
        const result = await response.json()
        if (!response.ok || result.code !== 200 || !result.data.url) throw new Error(result.message || '图片上传失败')
        if (this.destroyed || !this.Quill) return
        const url = mediaUrl(result.data.url)
        // Confirm that the uploaded file can actually be displayed before inserting it.
        await new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = resolve
          image.onerror = () => reject(new Error('图片已上传，但暂时无法读取，请重试'))
          image.src = url
        })
        if (this.destroyed || !this.Quill) return
        this.Quill.updateContents(new Delta().retain(range.index).delete(range.length).insert({ image: url }), 'user')
        this.Quill.setSelection(range.index + 1, 0, 'silent')
      } catch (error) {
        if (!this.destroyed) this.$message.error(error.message || '图片上传失败，请重试')
      } finally { this.uploading = false }
    },
  },
}
</script>

<style>
.ql-editor img, .ql-editor video { max-width: 100%; height: auto; }
.ql-editor { white-space: pre-wrap; }
</style>
