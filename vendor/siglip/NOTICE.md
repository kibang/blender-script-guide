# SigLIP base patch16-224 (image encoder only, 8-bit ONNX)

- Model: SigLIP (Sigmoid Loss for Language Image Pre-Training), Zhai et al., 2023 — Google, `google/siglip-base-patch16-224`
  https://huggingface.co/google/siglip-base-patch16-224 — License: **Apache License 2.0** (full text: `LICENSE`)
- ONNX conversion / 8-bit quantization: Xenova (transformers.js), `Xenova/siglip-base-patch16-224`, file `onnx/vision_model_quantized.onnx`
  https://huggingface.co/Xenova/siglip-base-patch16-224 — Apache License 2.0
- File shipped here unchanged: `vision_model_quantized.onnx` (99,499,129 bytes, sha256 ef14a954f3d57e1806666432bd9785004c1dc27100aa260eee0cb0f10a5de058).
- Text embeddings (`text_emb.bin`) were computed offline with the matching SigLIP text encoder (`text_model_quantized.onnx`) for this app's
  157 class names × prompt templates; the text encoder itself is not shipped. Modification notice (Apache-2.0 §4b): the embeddings file is a derived work.
- Runtime: onnxruntime-web 1.31.1 (MIT, Microsoft) — see `../ort/LICENSE`.
