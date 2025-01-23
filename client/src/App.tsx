import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import NearMe from "@/pages/NearMe";
import EstablishmentDetails from "@/pages/EstablishmentDetails";
import Profile from "@/pages/profile";
import TopRated from "@/pages/TopRated";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import Feedback from "@/pages/feedback";
import AdminFeedback from "@/pages/admin/feedback";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/near-me" component={NearMe} />
      <Route path="/establishments/:yelpId" component={EstablishmentDetails} />
      <Route path="/profile" component={Profile} />
      <Route path="/top-rated" component={TopRated} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <FeedbackButton />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;