import { Suspense, lazy } from "react";
import { App as AntApp, ConfigProvider, Spin } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { tokenStore } from "@/api";
import "./App.css";

const ChatWindow = lazy(() =>
  import("@/pages/chatWindow").then((module) => ({ default: module.ChatWindow })),
);

const LoginPage = lazy(() =>
  import("@/pages/auth").then((module) => ({ default: module.LoginPage })),
);

const ProfilePage = lazy(() =>
  import("@/pages/profile").then((module) => ({ default: module.ProfilePage })),
);

const chatTheme = {
  token: {
    colorPrimary: "#f9a8d4",
    colorPrimaryHover: "#f472b6",
    colorPrimaryActive: "#f472b6",
    colorPrimaryBg: "#fef7fb",
    colorPrimaryBgHover: "#fce7f3",
    colorPrimaryBorder: "#fdd5ea",
    colorLink: "#f472b6",
    colorLinkHover: "#ec4899",
    fontSize: 14,
  },
  components: {
    Button: {
      primaryShadow: "0 4px 14px rgba(249, 168, 212, 0.28)",
    },
    Input: {
      activeBorderColor: "#fbb6ce",
      hoverBorderColor: "#fce7f3",
      activeShadow: "0 0 0 2px rgba(253, 213, 234, 0.55)",
    },
    FloatButton: {
      colorPrimary: "#f9a8d4",
      colorPrimaryHover: "#f472b6",
    },
  },
};

const hasLoginToken = (): boolean => {
  return Boolean(tokenStore.get());
};

const RequireAuth = () => {
  if (!hasLoginToken()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const OnlyGuest = () => {
  if (hasLoginToken()) {
    return <Navigate to="/chat" replace />;
  }
  return <Outlet />;
};

const RootRedirect = () => {
  return <Navigate to={hasLoginToken() ? "/chat" : "/login"} replace />;
};

const RouteLoading = () => <Spin size="large" />;

const App = () => (
  <ConfigProvider theme={chatTheme}>
    <AntApp>
      <div className="app-root">
        <div className="app-page-shell">
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route element={<OnlyGuest />}>
                <Route path="/login" element={<LoginPage />} />
              </Route>
              <Route element={<RequireAuth />}>
                <Route
                  path="/chat"
                  element={
                    <div className="app-chat-shell">
                      <ChatWindow />
                    </div>
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </AntApp>
  </ConfigProvider>
);

export default App;
