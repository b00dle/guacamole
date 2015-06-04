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

#ifndef GUA_TRIMESH_PASS_HPP
#define GUA_TRIMESH_PASS_HPP

#include <gua/renderer/PipelinePass.hpp>

#include <gua/platform.hpp>

// external headers
#include <scm/gl_core/buffer_objects.h>

namespace gua {


class GUA_DLL TriMeshPassDescription : public PipelinePassDescription {
 public:
  TriMeshPassDescription();

  TriMeshPassDescription& adaptive_abuffer(bool val);
  bool adaptive_abuffer() const;

  std::shared_ptr<PipelinePassDescription> make_copy() const override;
  friend class Pipeline;
 protected:
  PipelinePass make_pass(RenderContext const&, SubstitutionMap&) override;

  bool adaptive_abuffer_;
};

}

#endif  // GUA_TRIMESH_PASS_HPP
