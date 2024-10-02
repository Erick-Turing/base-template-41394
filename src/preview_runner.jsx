import React, { useState, useEffect } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FolderTree, File, AlertTriangle } from 'lucide-react';
import './index.css';

const Preview_Runner_Do_Not_Edit = () => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

  useEffect(() => {
    const importTasks = async () => {
      const taskModules = import.meta.glob('./tasks/**/*.jsx');
      const loadedTasks = [];

      for (const path in taskModules) {
        try {
          const module = await taskModules[path]();
          const pathParts = path.split('/');
          const taskId = pathParts[2];
          const fileName = pathParts.pop();

          loadedTasks.push({
            id: taskId,
            name: fileName,
            component: module.default,
            fullPath: path,
            isValid: !!module.default
          });
        } catch (error) {
          console.error(`Error loading module at ${path}:`, error);
          loadedTasks.push({
            id: path,
            name: path.split('/').pop(),
            fullPath: path,
            isValid: false
          });
        }
      }

      setTasks(loadedTasks.sort((a, b) => a.fullPath.localeCompare(b.fullPath)));
      if (loadedTasks.length > 0) {
        setCurrentTask(loadedTasks.find(task => task.isValid) || loadedTasks[0]);
      }
    };

    importTasks();
  }, []);

  const FolderHierarchy = () => {
    const hierarchy = {};
    tasks.forEach(task => {
      const parts = task.fullPath.split('/');
      let current = hierarchy;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? task : {};
        }
        current = current[part];
      });
    });

    const renderFolder = (folder, path = '') => {
      return (
        <ul className="pl-4">
          {Object.entries(folder).map(([name, content]) => (
            <li key={`${path}/${name}`} className="my-1">
              {typeof content === 'object' && !content.fullPath ? (
                <>
                  <span className="flex items-center text-white">
                    <FolderTree size={16} className="mr-1" />
                    {name}
                  </span>
                  {renderFolder(content, `${path}/${name}`)}
                </>
              ) : (
                <span
                  className={`flex items-center cursor-pointer ${
                    content.isValid
                      ? currentTask && content.fullPath === currentTask.fullPath
                        ? 'font-bold text-green-400 hover:text-green-400'
                        : 'text-white hover:text-green-200'
                      : 'text-yellow-300 hover:text-yellow-100'
                  }`}
                  onClick={() => {
                    setCurrentTask(content);
                    if (!content.isValid) {
                      console.warn(`Invalid or empty task: ${content.fullPath}`);
                    }
                  }}
                >
                  {content.isValid ? (
                    <File size={16} className="mr-1" />
                  ) : (
                    <AlertTriangle size={16} className="mr-1" />
                  )}
                  {name}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    };

    return renderFolder(hierarchy);
  };

  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="flex-grow">
        {currentTask && currentTask.isValid && currentTask.component && (
          <currentTask.component />
        )}
        {currentTask && !currentTask.isValid && (
          <div className="text-yellow-800 flex items-center">
            <AlertTriangle size={24} className="mr-2" />
            This task is invalid or empty. Please check the file: {currentTask.fullPath}
          </div>
        )}
      </div>
      <button 
      onClick={() => setShowHierarchy((prev) => !prev)} 
      className="fixed bottom-4 left-4 px-4 py-2 bg-black bg-opacity-10 rounded z-10"
    >
      {currentTask && (
        <>
          Task {currentTask.id}: <span className="font-bold">{currentTask.name}</span>
        </>
      )}
    </button>
      {showHierarchy && (
        <div className="fixed bottom-16 left-4 p-4 bg-black bg-opacity-75 backdrop-blur-md rounded max-h-[70vh] w-[300px] overflow-auto">
          <h3 className="text-lg font-semibold mb-2 text-white">Select Preview File</h3>
          <FolderHierarchy />
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview_Runner_Do_Not_Edit />
  </StrictMode>
);