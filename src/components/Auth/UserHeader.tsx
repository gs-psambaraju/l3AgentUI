import { LogOut, User, Shield } from 'lucide-react';
import { AuthUser } from '../../services/authService';

interface UserHeaderProps {
  user: AuthUser;
  onLogout: () => void;
}

export const UserHeader = ({ user, onLogout }: UserHeaderProps) => {
  const initials = user.userName 
    ? user.userName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email.split('@')[0].slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatar */}
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-medium">{initials}</span>
      </div>
      
      {/* User Info */}
      <div className="hidden sm:block">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {user.userName || user.email.split('@')[0]}
          </span>
          {user.role && (
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
              {user.role}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        title="Logout"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}; 