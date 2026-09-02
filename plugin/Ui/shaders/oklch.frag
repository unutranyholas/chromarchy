#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
  mat4 qt_Matrix;
  float qt_Opacity;
  int pickerChannel;
  float pickerLightness;
  float pickerChroma;
  float pickerHue;
  vec2 pickerSize;
  float pickerRadius;
  int pickerRoundTop;
  int pickerRoundBottom;
};

vec3 oklchToLinearSrgb(float lightness, float chroma, float hue) {
  float angle = radians(hue);
  float a = chroma * cos(angle);
  float b = chroma * sin(angle);
  float lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  float mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  float sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  float l = lRoot * lRoot * lRoot;
  float m = mRoot * mRoot * mRoot;
  float s = sRoot * sRoot * sRoot;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  );
}

float gammaChannel(float value) {
  return value <= 0.0031308
    ? 12.92 * value
    : 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

bool inGamut(vec3 color) {
  return all(greaterThanEqual(color, vec3(0.0)))
    && all(lessThanEqual(color, vec3(1.0)));
}

float fitChroma(float lightness, float chroma, float hue) {
  if (inGamut(oklchToLinearSrgb(lightness, chroma, hue))) {
    return chroma;
  }
  float low = 0.0;
  float high = chroma;
  for (int index = 0; index < 10; index++) {
    float middle = (low + high) / 2.0;
    if (inGamut(oklchToLinearSrgb(lightness, middle, hue))) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

void main() {
  vec2 point = qt_TexCoord0 * pickerSize;
  float coverage = 1.0;
  if (pickerRoundTop == 1 && point.y < pickerRadius) {
    vec2 center = vec2(
      point.x < pickerSize.x / 2.0
        ? pickerRadius
        : pickerSize.x - pickerRadius,
      pickerRadius
    );
    if (point.x < pickerRadius || point.x > pickerSize.x - pickerRadius) {
      coverage = 1.0 - smoothstep(
        pickerRadius - 1.0,
        pickerRadius + 1.0,
        distance(point, center)
      );
    }
  }
  if (pickerRoundBottom == 1 && point.y > pickerSize.y - pickerRadius) {
    vec2 center = vec2(
      point.x < pickerSize.x / 2.0
        ? pickerRadius
        : pickerSize.x - pickerRadius,
      pickerSize.y - pickerRadius
    );
    if (point.x < pickerRadius || point.x > pickerSize.x - pickerRadius) {
      coverage = min(coverage, 1.0 - smoothstep(
        pickerRadius - 1.0,
        pickerRadius + 1.0,
        distance(point, center)
      ));
    }
  }
  float lightness = pickerChannel == 0 ? qt_TexCoord0.x : pickerLightness;
  float chroma = pickerChannel == 1 ? 0.4 * qt_TexCoord0.x : pickerChroma;
  float hue = pickerChannel == 2 ? 360.0 * qt_TexCoord0.x : pickerHue;
  if (pickerChannel != 1) {
    chroma = fitChroma(lightness, chroma, hue);
  }
  vec3 linear = oklchToLinearSrgb(lightness, chroma, hue);
  if (inGamut(linear)) {
    vec3 color = vec3(
      gammaChannel(linear.r),
      gammaChannel(linear.g),
      gammaChannel(linear.b)
    );
    fragColor = vec4(color * coverage, coverage) * qt_Opacity;
  } else {
    fragColor = vec4(0.0);
  }
}
