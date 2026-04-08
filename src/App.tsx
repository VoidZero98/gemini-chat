import { ConfigProvider } from "antd";
import { ChatWindow } from "@/pages/chatWindow";
import "./App.css";

const chatTheme = {
  token: {
    colorPrimary: "#db2777",
    colorPrimaryHover: "#e11d74",
    colorPrimaryActive: "#be185d",
    colorPrimaryBg: "#fce7f3",
    colorPrimaryBgHover: "#fbcfe8",
    colorPrimaryBorder: "#f9a8d4",
    colorLink: "#db2777",
    colorLinkHover: "#e11d74",
    fontSize: 14,
  },
  components: {
    Button: {
      primaryShadow: "0 4px 12px rgba(219, 39, 119, 0.28)",
    },
    Input: {
      activeBorderColor: "#f472b6",
      hoverBorderColor: "#fbcfe8",
      activeShadow: "0 0 0 2px rgba(244, 114, 182, 0.18)",
    },
    FloatButton: {
      colorPrimary: "#db2777",
      colorPrimaryHover: "#e11d74",
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
