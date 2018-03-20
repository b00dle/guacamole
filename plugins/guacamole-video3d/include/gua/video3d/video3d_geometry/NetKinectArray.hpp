#ifndef VIDEO3D_NETKINECTARRAY_HPP
#define VIDEO3D_NETKINECTARRAY_HPP

#include <gua/video3d/video3d_geometry/KinectCalibrationFile.hpp>

#include <atomic>
#include <mutex>
#include <thread>

struct RGBDSizes {
  const unsigned color_width = 1280;
  const unsigned color_height = 1080;
  const unsigned color_width_h = color_width/2;
  const unsigned color_height_h = color_height/2;
  const unsigned depth_width = 512;
  const unsigned depth_height = 424;
  const unsigned colorsize_byte = color_width * color_height * 3;
  const unsigned colorsize_byte_h = color_width_h * color_height_h * 3;
  const unsigned depthsize_byte = depth_width * depth_height * sizeof(float);
  const unsigned points_per_grid = 0.01 * 256;
  const unsigned mask_height = 16;
  const unsigned mask_width = 16;
  
};

namespace video3d{


class NetKinectArray{

public:
  NetKinectArray(const std::vector<std::shared_ptr<KinectCalibrationFile>>& calib_files,
                 const std::string& server_endpoint, unsigned colorsize_byte, unsigned depthsize_byte);
  ~NetKinectArray();

  bool update();
  inline unsigned char* getBuffer() { return m_buffer.data(); }

private:
  void readloop();

  std::mutex m_mutex;
  bool           m_running;
  const std::string m_server_endpoint;
  std::vector<std::shared_ptr<KinectCalibrationFile>> m_calib_files;
  unsigned m_colorsize_byte;
  unsigned m_depthsize_byte;
  std::vector<uint8_t> m_buffer;
  std::vector<uint8_t> m_buffer_back;
  std::atomic<bool> m_need_swap;
  std::thread m_recv;
};


}


#endif // #ifndef VIDEO3D_NETKINECTARRAY_HPP
