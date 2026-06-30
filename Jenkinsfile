pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKERHUB_USER = 'jairo1995'
        BACKEND_IMAGE = 'jairo1995/sistema-control-backend'
        FRONTEND_IMAGE = 'jairo1995/sistema-control-frontend'
        FRONTEND_API_URL = 'http://3.235.13.32:30081/api'
        K8S_MASTER_IP = '13.222.26.199'
        K8S_NAMESPACE = 'sistema-control'
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
                    pwd
                    ls -la
                    ls -la back
                    ls -la frontend
                    ls -la k8s
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

        stage('Login Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage('Publicar imágenes en Docker Hub') {
            steps {
                sh '''
                    echo "=== Subiendo imágenes a Docker Hub ==="
                    docker push $BACKEND_IMAGE:latest
                    docker push $FRONTEND_IMAGE:latest
                '''
            }
        }

        stage('Desplegar en Kubernetes') {
            steps {
                sshagent(credentials: ['k8s-master-ssh']) {
                    sh '''
                        echo "=== Desplegando en Kubernetes mediante SSH ==="

                        ssh -o StrictHostKeyChecking=no ec2-user@$K8S_MASTER_IP "
                            kubectl rollout restart deployment backend-deployment -n $K8S_NAMESPACE &&
                            kubectl rollout restart deployment frontend-deployment -n $K8S_NAMESPACE &&
                            kubectl rollout status deployment backend-deployment -n $K8S_NAMESPACE &&
                            kubectl rollout status deployment frontend-deployment -n $K8S_NAMESPACE &&
                            kubectl get pods -n $K8S_NAMESPACE &&
                            kubectl get svc -n $K8S_NAMESPACE
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline CI/CD ejecutado correctamente: build, test, push y despliegue en Kubernetes completados.'
        }

        failure {
            echo 'Pipeline CI/CD falló. Revisar la consola de Jenkins.'
        }

        always {
            echo 'Finalizó la ejecución del pipeline CI/CD hacia Kubernetes.'
        }
    }
}