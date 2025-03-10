import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState(null);
  const [project, setProject] = useState([]);

  const navigate = useNavigate();

  // Create a new project
  const createProject = (e) => {
    e.preventDefault();
    console.log({ projectName });

    axios
      .post('/projects/create', {
        name: projectName,
      })
      .then((res) => {
        console.log(res);
        setIsModalOpen(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Fetch all projects
  useEffect(() => {
    axios
      .get('/projects/all')
      .then((res) => {
        setProject(res.data.projects);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <main className="p-4 min-h-screen bg-gray-900 text-white">
      <div className="projects flex flex-wrap gap-3">
        {/* Create New Community Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="project p-4 border border-gray-700 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          Create New Community
          <i className="ri-link ml-2"></i>
        </button>

        {/* Project Cards */}
        {project.map((project) => (
          <div
            key={project._id}
            onClick={() => {
              navigate(`/project`, {
                state: { project },
              });
            }}
            className="project flex flex-col gap-2 cursor-pointer p-4 border border-gray-700 rounded-md min-w-52 bg-gray-800 hover:bg-gray-700 transition-all duration-300"
          >
            <h2 className="font-semibold text-white">{project.name}</h2>
            <div className="flex gap-2 text-gray-300">
              <p>
                <small>
                  <i className="ri-user-line"></i> Collaborators
                </small>{' '}
                :
              </p>
              {project.users.length}
            </div>
          </div>
        ))}
      </div>

      {/* Create New Community Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-md shadow-md w-1/3">
            <h2 className="text-xl mb-4 text-white">Create New Community</h2>
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  Community Name
                </label>
                <input
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  className="mt-1 block w-full p-2 border border-gray-700 rounded-md bg-gray-700 text-white"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-all duration-300"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-300"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;