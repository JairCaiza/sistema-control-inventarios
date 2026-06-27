pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        BACKEND_IMAGE = 'sistemacontrolinventarios-backend-ci'
        FRONTEND_IMAGE = 'sistemacontrolinventarios-frontend-ci'
        FRONTEND_API_URL = 'http://localhost:3001/api'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Información del entorno') {
            steps {
                sh 'node --version || true'
                sh 'npm --version || true'
                sh 'docker --version'
                sh 'git --version'
            }
        }

        stage('Instalar dependencias Backend') {
            steps {
                dir('back') {
                    sh 'npm install'
                }
            }
        }

        stage('Instalar dependencias Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Compilar Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Construir imagen Backend') {
            steps {
                sh 'docker build -t $BACKEND_IMAGE:latest ./back'
            }
        }

        stage('Construir imagen Frontend') {
            steps {
                sh 'docker build --build-arg VITE_API_URL=$FRONTEND_API_URL -t $FRONTEND_IMAGE:latest ./frontend'
            }
        }

        stage('Verificar imágenes') {
            steps {
                sh 'docker images | grep sistemacontrolinventarios'
            }
        }
    }

    post {
        success {
            echo 'Pipeline CI ejecutado correctamente.'
        }

        failure {
            echo 'Pipeline CI falló. Revisar la consola de Jenkins.'
        }

        always {
            echo 'Finalizó la ejecución del pipeline.'
        }
    }
}