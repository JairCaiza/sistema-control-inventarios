pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
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

        stage('Verificar entorno') {
            steps {
                sh '''
                    echo "=== Información del entorno CI/CD ==="
                    git --version
                    docker --version
                    docker-compose --version || true
                    pwd
                    ls -la
                    ls -la back
                    ls -la frontend
                '''
            }
        }

        stage('Pruebas Backend') {
            steps {
                sh '''
                    echo "=== Ejecutando pruebas automatizadas del backend ==="
                    docker build -t backend-test-runner ./back
                    docker run --rm backend-test-runner npm test
                '''
            }
        }

        stage('Construir imagen Backend') {
            steps {
                sh '''
                    echo "=== Construyendo imagen Docker del backend ==="
                    docker build --no-cache -t $BACKEND_IMAGE:latest ./back
                '''
            }
        }

        stage('Construir imagen Frontend') {
            steps {
                sh '''
                    echo "=== Construyendo imagen Docker del frontend ==="
                    docker build --no-cache \
                      --build-arg VITE_API_URL=$FRONTEND_API_URL \
                      -t $FRONTEND_IMAGE:latest ./frontend
                '''
            }
        }

        stage('Verificar imágenes') {
            steps {
                sh '''
                    echo "=== Imágenes generadas por el pipeline CI/CD ==="
                    docker images | grep sistemacontrolinventarios
                '''
            }
        }

        stage('Despliegue con Docker Compose') {
            steps {
                sh '''
                    echo "=== Desplegando aplicación con Docker Compose ==="
                    docker-compose down || true
                    docker-compose up -d --build
                    docker-compose ps
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline CI/CD ejecutado correctamente: construcción, pruebas, validación y despliegue completados.'
        }

        failure {
            echo 'Pipeline CI/CD falló. Revisar la consola de Jenkins.'
        }

        always {
            echo 'Finalizó la ejecución del pipeline de Integración y Despliegue Continuo.'
        }
    }
}