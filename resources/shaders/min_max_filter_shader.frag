/******************************************************************************
 * guacamole - delicious VR                                                   *
 *                                                                            *
 * Copyright: (c) 2011-2013 Bauhaus-Universität Weimar                        *
 * Contact:   felix.lauer@uni-weimar.de / simon.schneegans@uni-weimar.de      *
 *                                                                            *
 * This program is free software: you can redistribute it and/or modify it    *
 * under the terms of the GNU General Public License as published by the Free *
 * Software Foundation, either version 3 of the License, or (at your option)  *
 * any later version.                                                         *
 *                                                                            *
 * This program is distributed in the hope that it will be useful, but        *
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY *
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License   *
 * for more details.                                                          *
 *                                                                            *
 * You should have received a copy of the GNU General Public License along    *
 * with this program. If not, see <http://www.gnu.org/licenses/>.             *
 *                                                                            *
 ******************************************************************************/

@include "shaders/common/header.glsl"

uniform uvec2 depth_buffer;
uniform uvec2 min_max_depth_buffer;
uniform int   current_level;

in vec2 gua_quad_coords;

layout(pixel_center_integer) in vec4 gl_FragCoord;

// write output
#if @generation_mode@ == 2 // DEPTH_THRESHOLD
layout(location=0) out vec3 result;
#else
layout(location=0) out uint result;
#endif

@include "shaders/warp_grid_bits.glsl"

uint is_on_line(float a, float b, float c, float d) {
  return int(abs(a-2*b+c) < @split_threshold@ && abs(b-2*c+d) < @split_threshold@);
}

uint is_on_line(float a, float b, float c) {
  return int(abs(a-2*b+c) < @split_threshold@);
}

void main() {

  // ---------------------------------------------------------------------------
  #if @generation_mode@ == 0 // SURFACE_ESTIMATION -----------------------------
  // ---------------------------------------------------------------------------

  if (current_level == 0) {

    //    d0 d1
    //    |   |
    // d2-d3-d4-d5
    //    |   |
    // d6-d7-d8-d9
    //    |   |
    //   d10 d11

    const ivec2 res = textureSize(sampler2D(depth_buffer), 0) - 1;

    const float d0  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  2))), 0).x;
    const float d1  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  2))), 0).x;

    const float d2  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1,  1))), 0).x;
    const float d3  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  1))), 0).x;
    const float d4  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  1))), 0).x;
    const float d5  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2,  1))), 0).x;

    const float d6  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1,  0))), 0).x;
    const float d7  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  0))), 0).x;
    const float d8  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  0))), 0).x;
    const float d9  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2,  0))), 0).x;

    const float d10 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0, -1))), 0).x;
    const float d11 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1, -1))), 0).x;

    result = is_on_line(d0, d3, d7, d10)
           & is_on_line(d1, d4, d8, d11)
           & is_on_line(d2, d3, d4, d5)
           & is_on_line(d6, d7, d8, d9);

  } else {

    // s0-s1
    // |   |
    // s2-s3

    uint s0 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 1)).x;
    uint s1 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 1)).x;
    uint s2 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 0)).x;
    uint s3 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 0)).x;

    // if each child has been a connected surface, the parent is as a surface as well
    result = s0 & s1 & s2 & s3;
  }

  // ---------------------------------------------------------------------------
  #elif @generation_mode@ == 1 // ADAPTIVE_SURFACE_ESTIMATION ------------------
  // ---------------------------------------------------------------------------

  if (current_level == 0) {

    // d0  d1   d2   d3
    //   \  |    |  /
    // d4--d5-- d6-- d7
    //      |    |
    // d8--d9--d10--d11
    //   /  |    |  \
    // d12 d13  d14 d15

    const ivec2 res = textureSize(sampler2D(depth_buffer), 0) - 1;

    const float d0  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1,  2))), 0).x;
    const float d1  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  2))), 0).x;
    const float d2  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  2))), 0).x;
    const float d3  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2,  2))), 0).x;

    const float d4  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1,  1))), 0).x;
    const float d5  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  1))), 0).x;
    const float d6  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  1))), 0).x;
    const float d7  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2,  1))), 0).x;

    const float d8  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1,  0))), 0).x;
    const float d9  = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0,  0))), 0).x;
    const float d10 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1,  0))), 0).x;
    const float d11 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2,  0))), 0).x;

    const float d12 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2(-1, -1))), 0).x;
    const float d13 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 0, -1))), 0).x;
    const float d14 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 1, -1))), 0).x;
    const float d15 = texelFetch(sampler2D(depth_buffer), max(ivec2(0), min(res, ivec2(gl_FragCoord.xy*2) + ivec2( 2, -1))), 0).x;

    // check for horizontal and vertical continuity
    const uint t = is_on_line(d1, d5, d9)  & is_on_line(d2, d6,  d10);
    const uint r = is_on_line(d5, d6, d7)  & is_on_line(d9, d10, d11);
    const uint b = is_on_line(d5, d9, d13) & is_on_line(d6, d10, d14);
    const uint l = is_on_line(d4, d5, d6)  & is_on_line(d8, d9,  d10);

    // check for diagonal continuity
    const uint tl = is_on_line(d0,  d5,  d10);
    const uint tr = is_on_line(d3,  d6,  d9);
    const uint bl = is_on_line(d12, d9,  d6);
    const uint br = is_on_line(d5,  d10, d15);

    // if the patch is connected on to othogonal sides, it represents a surface
    const uint is_surface = (t & r) | (r & b) | (b & l) | (l & t);

    // store all continuities
    const uint continious = (t  << BIT_CONTINIOUS_T)
                    | (r  << BIT_CONTINIOUS_R)
                    | (b  << BIT_CONTINIOUS_B)
                    | (l  << BIT_CONTINIOUS_L)
                    | (tl << BIT_CONTINIOUS_TL)
                    | (tr << BIT_CONTINIOUS_TR)
                    | (bl << BIT_CONTINIOUS_BL)
                    | (br << BIT_CONTINIOUS_BR);

    result = is_surface | continious;

  } else {

    // s0-s1
    // |   |
    // s2-s3

    const uint s0 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 1)).x;
    const uint s1 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 1)).x;
    const uint s2 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 0)).x;
    const uint s3 = texelFetchOffset(usampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 0)).x;

    // check for internal continuity
    const uint internal_continuity = (s0 >> BIT_CONTINIOUS_R)
                             & (s0 >> BIT_CONTINIOUS_B)
                             & (s3 >> BIT_CONTINIOUS_T)
                             & (s3 >> BIT_CONTINIOUS_L) & 1;

    // if any child is no complete surface, the parent is neither
    const uint is_surface = s0 & s1 & s2 & s3 & internal_continuity;

    // check for external continuity
    const uint continious = (((s0 >> BIT_CONTINIOUS_T) & (s1 >> BIT_CONTINIOUS_T) & 1) << BIT_CONTINIOUS_T)
                    | (((s1 >> BIT_CONTINIOUS_R) & (s3 >> BIT_CONTINIOUS_R) & 1) << BIT_CONTINIOUS_R)
                    | (((s2 >> BIT_CONTINIOUS_B) & (s3 >> BIT_CONTINIOUS_B) & 1) << BIT_CONTINIOUS_B)
                    | (((s0 >> BIT_CONTINIOUS_L) & (s2 >> BIT_CONTINIOUS_L) & 1) << BIT_CONTINIOUS_L)
                    | (((s0 >> BIT_CONTINIOUS_TL) & 1) << BIT_CONTINIOUS_TL)
                    | (((s1 >> BIT_CONTINIOUS_TR) & 1) << BIT_CONTINIOUS_TR)
                    | (((s2 >> BIT_CONTINIOUS_BL) & 1) << BIT_CONTINIOUS_BL)
                    | (((s3 >> BIT_CONTINIOUS_BR) & 1) << BIT_CONTINIOUS_BR);

    result = is_surface | continious;
  }

  // ---------------------------------------------------------------------------
  #else // DEPTH_THRESHOLD -----------------------------------------------------
  // ---------------------------------------------------------------------------


  if (current_level == 0) {
    const float d0 = texelFetchOffset(sampler2D(depth_buffer), ivec2(gl_FragCoord.xy*2), 0, ivec2(0, 0)).x;
    const float d1 = texelFetchOffset(sampler2D(depth_buffer), ivec2(gl_FragCoord.xy*2), 0, ivec2(0, 1)).x;
    const float d2 = texelFetchOffset(sampler2D(depth_buffer), ivec2(gl_FragCoord.xy*2), 0, ivec2(1, 0)).x;
    const float d3 = texelFetchOffset(sampler2D(depth_buffer), ivec2(gl_FragCoord.xy*2), 0, ivec2(1, 1)).x;

    const float min_0 = min(d0, d1);
    const float min_1 = min(d2, d3);

    const float max_0 = max(d0, d1);
    const float max_1 = max(d2, d3);

    result.yz = vec2(min(min_0, min_1), max(max_0, max_1));
    result.x = abs(result.y - result.z) > @split_threshold@ ? 0 : 1;

  } else {
    const vec3 sample_0 = texelFetchOffset(sampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 0)).xyz;
    const vec3 sample_1 = texelFetchOffset(sampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 0)).xyz;
    const vec3 sample_2 = texelFetchOffset(sampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(0, 1)).xyz;
    const vec3 sample_3 = texelFetchOffset(sampler2D(min_max_depth_buffer), ivec2(gl_FragCoord.xy*2), current_level-1, ivec2(1, 1)).xyz;

    result.x = min(min(sample_0.x, sample_1.x), min(sample_2.x, sample_3.x));

    if (result.x != 0) {
      const float min_0 = min(sample_0.y, sample_1.y);
      const float min_1 = min(sample_2.y, sample_3.y);

      const float max_0 = max(sample_0.z, sample_1.z);
      const float max_1 = max(sample_2.z, sample_3.z);

      result.yz = vec2(min(min_0, min_1), max(max_0, max_1));
      result.x = abs(result.y - result.z) > @split_threshold@ ? 0 : 1;
    }
  }

  #endif
}
