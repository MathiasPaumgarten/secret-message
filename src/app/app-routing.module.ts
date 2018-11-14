import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CreateComponent } from "./create/create.component";
import { HomeComponent } from "./home/home.component";

const routes: Routes = [
    {
        component: HomeComponent,
        path: "",
    },
    {
        component: CreateComponent,
        path: "create",
    },
];

@NgModule( {
  imports: [ RouterModule.forRoot( routes ) ],
  exports: [ RouterModule ]
} )
export class AppRoutingModule { }
