import React, {useEffect} from 'react'
import { Layout } from 'antd';
import SideBar from './SideBar';
import Header from './Header';
import {usePageUnloadGuard} from "@/hooks/usePageUnloadGuard";
import KronosSpin from "@/components/KronosSpin";
import {NomyxEvent} from "@/utils/Constants";
import { useRouter } from 'next/router';



const { Content } = Layout;

export const MainLayout = ({ children }: any) => {

    const router = useRouter();

    const listener = usePageUnloadGuard();
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
      const handleStart = (url: string) => {
        setLoading(true);
      }
      const handleComplete = (url: string) => {
        setLoading(false);
      }

      router.events.on('routeChangeStart', handleStart);
      router.events.on('routeChangeComplete', handleComplete);
      router.events.on('routeChangeError', handleComplete);

      return () => {
        router.events.off('routeChangeStart', handleStart);
        router.events.off('routeChangeComplete', handleComplete);
        router.events.off('routeChangeError', handleComplete);
      };
    });

    return (
        <Layout style={{ minHeight:"100vh" }}>
            <Header />
            <div className='sm:hidden w-[100%] h-[100%] text-white p-4 text-center overflow-hidden absolute top-0 left-0 flex justify-center items-center z-20'>
              We&apos;re sorry, but this application is not supported on mobile
              devices.
            </div>
            <Layout className='hidden sm:flex'>
                <SideBar/>
                <Content>
                    <div className='w-[100%] h-[100%] overflow-hidden absolute top-0 left-0 flex justify-center items-center z-20'
                         style={{backgroundColor:"rgba(0,0,0,0.8)", visibility:loading?"visible":"hidden"}}>
                        <KronosSpin/>
                    </div>

                    <div className="p-4 h-full">{children}</div>

                </Content>
            </Layout>
        </Layout>
    );
}
