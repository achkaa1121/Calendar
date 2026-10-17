import { useState } from "react";
import axios from "axios";
import { api } from "../lib/api";

interface UseAuthReturn {
  isLogin: boolean;
  setIsLogin: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  error: string;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useAuth = (onSuccess: () => void): UseAuthReturn => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { email, password, name };

      const response = await api.post(endpoint, payload);
      const { token } = response.data;

      localStorage.setItem("token", token);
      onSuccess();
    } catch (error: unknown) {
      const responseError = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      setError(responseError || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return {
    isLogin,
    setIsLogin,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    error,
    loading,
    handleSubmit,
  };
};
