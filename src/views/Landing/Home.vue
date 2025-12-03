<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Bell, Radio, BarChart3, Shield, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col">
    <main>
      <section class="relative overflow-hidden bg-linear-to-b from-background to-muted/10">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div class="mx-auto max-w-3xl text-center">
            <h1 class="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Monitoreo Inteligente de Ganado con Tecnología BLE
            </h1>
            <p class="mt-6 text-xl leading-relaxed text-muted-foreground">
              Mantén tu ganadería bajo control con nuestro sistema de monitoreo en tiempo real mediante beacons BLE.
              Localiza tus animales, recibe alertas y optimiza la gestión de tu rancho.
            </p>

            <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <RouterLink to="/login" custom v-slot="{ navigate }">
                <Button size="lg" @click="navigate">Comenzar Ahora</Button>
              </RouterLink>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="relative w-full">
          <div class="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent z-10" />
          <img
            src="/images/cattle-grazing-in-green-pasture.png"
            alt="Ganado en pastizal"
            class="w-full h-auto object-cover"
          />
        </div>
      </section>

      <section id="features" class="py-16 sm:py-24 bg-background">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center mb-16">
            <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Características Principales
            </h2>
            <p class="mt-4 text-lg text-muted-foreground text-pretty">
              Todo lo que necesitas para gestionar tu ganadería de manera eficiente
            </p>
          </div>

          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin class="h-6 w-6 text-primary" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Localización en Tiempo Real</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Conoce la ubicación exacta de cada animal en tu rancho mediante zonas definidas por los escaneadores.
                </p>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Bell class="h-6 w-6 text-accent" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Alertas Inteligentes</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Recibe notificaciones instantáneas cuando un animal sale de las zonas monitoreadas o no es
                  detectado.
                </p>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Radio class="h-6 w-6 text-primary" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Tecnología BLE</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Beacons de bajo consumo energético con largo alcance para monitoreo continuo y confiable.
                </p>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <BarChart3 class="h-6 w-6 text-accent" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Dashboard Completo</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Visualiza toda tu ganadería en un panel intuitivo con información detallada de cada animal.
                </p>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield class="h-6 w-6 text-primary" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Seguridad Garantizada</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Protege tu inversión con monitoreo constante y prevención de pérdidas o robos de ganado.
                </p>
              </CardContent>
            </Card>

            <Card class="border-border">
              <CardContent class="pt-6">
                <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <Zap class="h-6 w-6 text-accent" />
                </div>
                <h3 class="mb-2 text-xl font-semibold text-foreground">Fácil Instalación</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Sistema plug-and-play que se configura en minutos. No requiere infraestructura compleja.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" class="py-16 sm:py-24 bg-muted/30">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center mb-16">
            <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Cómo Funciona
            </h2>
            <p class="mt-4 text-lg text-muted-foreground text-pretty">
              Tres simples pasos para comenzar a monitorear tu ganadería
            </p>
          </div>

          <div class="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div class="relative">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 class="mb-2 text-xl font-semibold text-foreground">Instala los Beacons</h3>
              <p class="text-muted-foreground leading-relaxed">
                Coloca los escaneadores en las diferentes zonas de tu rancho: establos, pastizales, áreas de
                alimentación, etc.
              </p>
            </div>

            <div class="relative">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-accent-foreground">
                2
              </div>
              <h3 class="mb-2 text-xl font-semibold text-foreground">Registra tu Ganado</h3>
              <p class="text-muted-foreground leading-relaxed">
                Añade cada animal al sistema con su identificación, nombre y foto. Asigna los tags BLE
                correspondientes.
              </p>
            </div>

            <div class="relative">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 class="mb-2 text-xl font-semibold text-foreground">Monitorea en Tiempo Real</h3>
              <p class="text-muted-foreground leading-relaxed">
                Accede al dashboard desde cualquier dispositivo y visualiza la ubicación de cada animal en tiempo
                real.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="w-full border-y border-border bg-card py-16 sm:py-24">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
            <div>
              <h3 class="text-2xl font-bold text-foreground mb-4 text-balance">Tecnología BLE Advertising</h3>
              <p class="text-muted-foreground leading-relaxed mb-6">
                Nuestro sistema utiliza Bluetooth Low Energy (BLE) en modo advertising, permitiendo que los beacons
                transmitan señales constantemente sin necesidad de emparejamiento. Los sondeadores captan estas
                señales y determinan la ubicación de cada animal basándose en la intensidad de la señal.
              </p>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <div class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span class="text-sm text-muted-foreground">Bajo consumo de batería (hasta 2 años)</span>
                </li>
                <li class="flex items-start gap-2">
                  <div class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span class="text-sm text-muted-foreground">Alcance de hasta 100 metros</span>
                </li>
                <li class="flex items-start gap-2">
                  <div class="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span class="text-sm text-muted-foreground">Resistente a condiciones climáticas adversas</span>
                </li>
              </ul>
            </div>
            <div class="relative">
              <img
                src="/images/beacon-technology-diagram-with-cattle.jpg"
                alt="Tecnología BLE"
                class="w-full rounded-lg border border-border"
              />
            </div>
          </div>
        </div>
      </section>
      
      <section id="contact" class="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto max-w-2xl text-center">
            <h2 class="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Accede a tu Plataforma de Monitoreo
            </h2>
            <p class="mt-4 text-lg leading-relaxed opacity-90 text-pretty">
              Únete a los ganaderos que ya confían en Bovino-io para proteger y gestionar su ganado de manera inteligente.
            </p>
            <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <RouterLink to="/login" custom v-slot="{ navigate }">
                <Button size="lg" variant="secondary" @click="navigate">Iniciar sesión</Button>
              </RouterLink>
              <Button
                size="lg"
                variant="outline"
                class="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              >
                <a href="#features">Más Información</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>