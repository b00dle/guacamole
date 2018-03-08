#ifndef SPOINTS_NETKINECTARRAY_HPP
#define SPOINTS_NETKINECTARRAY_HPP

#include <gua/renderer/RenderContext.hpp>

#include <atomic>
#include <mutex>
#include <thread>
#include <unordered_set>
#include "PointCloudGridEncoder.hpp"

namespace spoints{


struct key_package {
  bool is_camera;
  std::size_t view_uuid;
  bool stereo_mode;
  std::size_t framecount;
  std::size_t render_context_id;
};

struct matrix_package {
  float modelview_matrix[16];
  float projection_matrix[16];
  uint32_t res_xy[2];

/*
  void swap(matrix_package& rhs) {
    modelview_matrix.swap(rhs.modelview_matrix);
    projection_matrix.swap(rhs.projection_matrix);
  }
*/
};


//is_camera, view_uuid, stereo_mode, current_package);

struct camera_matrix_package {
  key_package k_package;
  matrix_package mat_package;

  bool operator<(camera_matrix_package const& rhs) {
    if(k_package.is_camera < rhs.k_package.is_camera) {
      return true;
    } else if (rhs.k_package.is_camera < k_package.is_camera) {
      return false;
    } else {
      if(k_package.view_uuid < rhs.k_package.view_uuid) {
        return true;
      } else if(rhs.k_package.view_uuid < k_package.view_uuid) {
        return false;
      } else {
        if(k_package.stereo_mode < rhs.k_package.stereo_mode) {
          return true;
        } else if(rhs.k_package.stereo_mode < k_package.stereo_mode) {
          if(k_package.framecount < rhs.k_package.framecount) {
            return true;
          } else {
            return false;
          }
        }
      }
    }
  }
};



class NetKinectArray{

public:
  NetKinectArray(const std::string& server_endpoint,
                 const std::string& feedback_endpoint = "");
  ~NetKinectArray();

  void draw(gua::RenderContext const& ctx);
  bool update(gua::RenderContext const& ctx);
  void update_feedback(gua::RenderContext const& ctx);

  inline unsigned char* getBuffer() { return m_buffer_.data(); }

  //void push_matrix_package(bool is_camera, std::size_t view_uuid, bool is_stereo_mode, matrix_package mp);
  void push_matrix_package(spoints::camera_matrix_package const& cam_mat_package);

private:
  void readloop();
  void sendfeedbackloop();

  //receiving geometry
  PointCloudGridEncoder m_encoder;
  std::vector<UncompressedVoxel> m_voxels;

  std::mutex m_mutex_;
  bool           m_running_;
  const std::string m_server_endpoint_;
  const std::string m_feedback_endpoint_;
  std::vector<uint8_t> m_buffer_;
  std::vector<uint8_t> m_buffer_back_;

  std::atomic<bool> m_need_cpu_swap_;
  mutable std::unordered_map<std::size_t,std::atomic<bool> > m_need_gpu_swap_;
  std::thread m_recv_;

  //sending matrices
  std::mutex m_feedback_mutex_;
  bool       m_feedback_running_;
  const std::string m_server_feedback_endpoint_;
  matrix_package m_matrix_package_;
  matrix_package m_matrix_package_back_;

  spoints::camera_matrix_package submitted_camera_matrix_package_;
  spoints::camera_matrix_package submitted_camera_matrix_package_back_;

  bool        current_feedback_is_camera_status_ = true;
  std::size_t current_feedback_view_uuid_ = {0};
  bool current_feedback_is_stereo_mode_;


  //std::map<key_package, matrix_package> cam_matrix_packages;
  std::vector<matrix_package> finalized_matrix_packages_to_submit_;
  std::vector<matrix_package> matrix_packages_to_submit_;
  std::vector<matrix_package> matrix_packages_to_collect_;


  std::size_t last_frame_count_ = std::numeric_limits<std::size_t>::max();
  std::size_t last_omitted_frame_count_ = std::numeric_limits<std::size_t>::max();
/*
  std::map<bool, std::map<size_t, std::map<bool, std::vector<matrix_package>> > >
  camera_group_to_uuid_to_matrix_package_list;
  std::map<bool, std::map<size_t, std::map<bool, std::vector<matrix_package>> > > 
  camera_group_to_uuid_to_matrix_package_list_back;
*/

  std::atomic<bool> m_feedback_need_swap_;
  std::thread m_send_feedback_;

  mutable std::unordered_set<std::size_t> known_context_ids_;
  mutable std::unordered_set<std::size_t> encountered_context_ids_for_feedback_frame_;

  mutable std::unordered_map<std::size_t, scm::gl::vertex_array_ptr> point_layout_per_context_;
  mutable std::unordered_map<std::size_t, scm::gl::buffer_ptr> net_data_vbo_per_context_;

  mutable std::unordered_map<std::size_t, std::size_t> num_points_to_draw_per_context_;

  mutable std::unordered_map<std::size_t, bool> is_vbo_created_per_context_;// = false;

  mutable std::unordered_map<std::size_t, std::size_t> encountered_frame_counts_per_context_;// = false;
};


}


#endif // #ifndef SPOINTS_NETKINECTARRAY_HPP
