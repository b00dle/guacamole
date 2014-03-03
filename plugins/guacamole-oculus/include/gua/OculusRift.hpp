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

#ifndef GUA_OCULUS_RIFT_HPP
#define GUA_OCULUS_RIFT_HPP

#if defined (_MSC_VER)
  #if defined (GUA_OCULUS_LIBRARY)
    #define GUA_OCULUS_DLL __declspec( dllexport )
  #else
#define GUA_OCULUS_DLL __declspec( dllimport )
  #endif
#else
  #define GUA_OCULUS_DLL
#endif // #if defined(_MSC_VER)

// guacamole headers
#include <gua/renderer/Window.hpp>

namespace OVR {
  class SensorFusion;
  class DeviceManager;
  class HMDDevice;
  class SensorDevice;
}

namespace gua {

class GUA_OCULUS_DLL OculusRift : public Window {
 public:

  static void init();

  OculusRift(std::string const& display);
  virtual ~OculusRift();

  void create_shader();

  // virtual
  void display(std::shared_ptr<Texture2D> const& left_texture,
               std::shared_ptr<Texture2D> const& right_texture);

  math::mat4 const get_transform() const;

  private:
    void display(std::shared_ptr<Texture2D> const& texture,
                 math::vec2ui const& size,
                 math::vec2ui const& position,
                 bool left);

    math::vec4 distortion_;

    OVR::SensorDevice*  sensor_;
    OVR::SensorFusion*  sensor_fusion_;
    OVR::HMDDevice*     device_;
};

}

#endif  // GUA_OCULUS_RIFT_HPP
