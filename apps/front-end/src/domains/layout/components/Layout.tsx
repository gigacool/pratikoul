import { Layout } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Header, Footer, Content } = Layout;

import style from './Layout.module.scss';

const AppLayout: React.FC = () => {
  const location = useLocation();


  return (
      <Layout className={style.layout}>

        <Header className={style.header}>
          <h1 title="it's pratique & hopefully cool">Pratikoul</h1>
          <span className={style.divider}></span>
          <nav>
            <Link to="/" className={location.pathname === '/' ? style.active : ''}>Home</Link>
            <Link to="/metrics" className={location.pathname === '/metrics' ? style.active : ''}>Metrics</Link>
          </nav>
        </Header>
        <Layout>
          {/* <Sider width="25%" className={style.sider}>
          Sider
          </Sider> */}
          <Content className={style.content}>
            <Outlet />
          </Content>
        </Layout>
        <Footer className={style.footer}>Footer</Footer>
      </Layout>
  );
};

export default AppLayout;