import { ConfigProvider } from "antd";
import { ChatWindow } from "@/pages/chatWindow";
import "./App.css";

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

const App = () => (
  <ConfigProvider theme={chatTheme}>
    <div className="app-root">
      <div className="app-chat-shell">
        <ChatWindow />
      </div>
    </div>
  </ConfigProvider>
);

export default App;
