import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ShipmentNotificationProps {
    shipmentId: string;
    trackingUrl: string;
    baseUrl: string;
}

export const ShipmentNotification = ({
    shipmentId,
    trackingUrl,
    baseUrl,
}: ShipmentNotificationProps) => {
    const previewText = `Tu envío ${shipmentId} está en camino`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans px-2">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/goingLogo.png`}
                                width="120"
                                height="auto"
                                alt="Going"
                                className="my-0 mx-auto"
                            />
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Tu envío está listo
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hola,
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Tu envío ha sido creado exitosamente y está siendo procesado por nuestra red logística.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px] bg-slate-50 p-4 rounded-lg border border-gray-100">
                            <Text className="text-gray-500 text-[12px] uppercase tracking-wider mb-2">
                                Escanea este código al recibir
                            </Text>
                            <Img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${shipmentId}`}
                                width="200"
                                height="200"
                                alt="QR Code"
                                className="my-0 mx-auto border-4 border-white rounded-lg shadow-sm"
                            />
                            <Text className="text-gray-400 font-mono text-[12px] mt-2">
                                ID: {shipmentId}
                            </Text>
                        </Section>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={trackingUrl}
                            >
                                Seguir mi envío
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            O copia y pega este enlace en tu navegador:
                            <br />
                            <Link href={trackingUrl} className="text-blue-600 no-underline">
                                {trackingUrl}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Esta es una notificación automática de Going. Por favor no respondas a este correo.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ShipmentNotification;
