# Third-party components / 제3자 구성요소

## AI photo recognition (사진 인식) — `vendor/siglip/`
- **SigLIP base patch16-224** image encoder — Google (Zhai, Mustafa, Kolesnikov, Beyer, "Sigmoid Loss for Language Image Pre-Training", ICCV 2023).
  Original weights: https://huggingface.co/google/siglip-base-patch16-224 — **Apache License 2.0**.
- 8-bit ONNX export `onnx/vision_model_quantized.onnx` by Xenova (transformers.js): https://huggingface.co/Xenova/siglip-base-patch16-224 — Apache License 2.0.
  Shipped unchanged as `vendor/siglip/vision_model_quantized.onnx`.
- `vendor/siglip/text_emb.bin`: text embeddings for this app's class names and prompts, computed offline with the matching SigLIP text encoder
  (derived work; the text encoder is not shipped).
- Full license text: `vendor/siglip/LICENSE` (Apache-2.0). Notice: `vendor/siglip/NOTICE.md`.

## Runtime — `vendor/ort/`
- **onnxruntime-web 1.31.1** (`ort.wasm.min.js`, `ort-wasm-simd-threaded.mjs`, `ort-wasm-simd-threaded.wasm`) — Microsoft, **MIT License**. Full text: `vendor/ort/LICENSE`.

## Sample photos
- Wikimedia Commons; author and license are shown under each sample in the app.
