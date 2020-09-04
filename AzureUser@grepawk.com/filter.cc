
#include "emscripten/bind.h"

using namespace emscripten;

const unsigned kRenderQuantumFrames = 128;
const unsigned kBytesPerChannel = kRenderQuantumFrames * sizeof(float);
class SimpleKernel {
 public:
  SimpleKernel() {}

  void Process(uintptr_t input_ptr, uintptr_t output_ptr,
               unsigned channel_count) {
    float* input_buffer = reinterpret_cast<float*>(input_ptr);
    float* output_buffer = reinterpret_cast<float*>(output_ptr);

    // Bypasses the data. By design, the channel count will always be the same
    // for |input_buffer| and |output_buffer|.
    for (unsigned channel = 0; channel < channel_count; ++channel) {
      float* destination = output_buffer + channel * kRenderQuantumFrames;
      float* source = input_buffer + channel * kRenderQuantumFrames;
      memcpy(destination, source, kBytesPerChannel);
    }
  }
};

EMSCRIPTEN_BINDINGS(CLASS_SimpleKernel) {
  class_<SimpleKernel>("SimpleKernel")
      .constructor()
      .function("process",
                &SimpleKernel::Process,
                allow_raw_pointers());
}