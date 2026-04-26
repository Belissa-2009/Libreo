import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export function UpdateToast() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({ immediate: true })

  useEffect(() => {
    if (needRefresh) {
      toast('Nueva versión disponible', {
        description: 'Recarga para actualizar la aplicación.',
        action: {
          label: 'Recargar',
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
        id: 'sw-update',
      })
    }
  }, [needRefresh, updateServiceWorker])

  return null
}
