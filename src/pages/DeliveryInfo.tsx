import React from "react";
import { Helmet } from "react-helmet-async";
import { Truck, MapPin, Info, Clock, Calendar, HelpCircle } from "lucide-react";
import { useZipCode } from "@/contexts/ZipCodeContext";
import ZipCodeSearch from "@/components/zip-code/ZipCodeSearch";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DeliveryInfo = () => {
  const { zipCode } = useZipCode();

  const deliverySteps = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Check Availability",
      description: "Enter your ZIP code to verify service in your area",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Schedule Delivery",
      description: "Choose your preferred delivery date and time window",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Prepare Location",
      description: "Ensure clear access for our delivery trucks",
    },
    {
      icon: <Info className="w-6 h-6" />,
      title: "Receive Materials",
      description: "We'll deliver and place materials in your specified location",
    },
  ];

  const requirements = [
    {
      question: "What access do you need?",
      answer: "We require a minimum of 11' width and 14' height clearance for our delivery trucks. Please ensure there are no low-hanging branches, power lines, or other obstacles.",
    },
    {
      question: "Where can materials be placed?",
      answer: "Materials must be delivered to a flat, stable surface. We cannot dump on grass or soft ground. The dump site should be within 10 feet of where the truck can safely park.",
    },
    {
      question: "What about weather conditions?",
      answer: "Deliveries may be rescheduled in cases of severe weather for safety reasons. We'll contact you to arrange an alternative delivery time if needed.",
    },
    {
      question: "Do I need to be present?",
      answer: "Yes, someone must be present to guide the driver to the exact dump location and sign for the delivery. This ensures materials are placed exactly where you need them.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Delivery Information - Gravel Delivery Services</title>
        <meta
          name="description"
          content="Learn about our delivery process, requirements, and service areas for gravel, sand, and dirt delivery."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/delivery">Delivery Info</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="bg-muted py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Delivery Information</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Learn about our delivery process, requirements, and service areas for all your material needs.
            </p>
            
            {!zipCode && (
              <div className="max-w-md mx-auto">
                <ZipCodeSearch />
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">How Delivery Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {deliverySteps.map((step, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                      {step.icon}
                    </div>
                    <CardTitle>{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{step.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Delivery Requirements</h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {requirements.map((req, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{req.question}</AccordionTrigger>
                    <AccordionContent>{req.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-3xl font-bold mb-4">Need More Information?</h2>
            <p className="text-muted-foreground mb-8">
              Contact our team for specific delivery questions or special requirements.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90"
              >
                <HelpCircle className="w-5 h-5" />
                Contact Us
              </a>
              <a
                href="/delivery-map"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/90"
              >
                <MapPin className="w-5 h-5" />
                View Delivery Map
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default DeliveryInfo;
