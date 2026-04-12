# AUDIO — Pan (`panner`)

## Summary

Mono level trim from normalized pan (-1..1); stereo imaging is a codegen concern.

## Ports

- **Inputs:** `in`, `pan`.
- **Outputs:** `out`.

## Faust notes

- Full stereo `de.panner` / spatial paths can replace the hint when outputs split to L/R.
