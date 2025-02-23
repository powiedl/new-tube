import { AlertTriangleIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const ErrorFallback = () => {
  return (
    <Card className='py-4 sm:py-6 md:py-8 lg:py-12 bg-destructive'>
      <CardHeader className='flex items-center mb-2 lg:mb-4'>
        <CardTitle className='flex gap-x-4'>
          <AlertTriangleIcon className='size-6' />
          <h1 className='text-base sm:text-base md:text-lg lg:text-2xl font-semibold'>
            An error occured
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent className='text-sm md:text-base lg:text-lg flex flex-col justify-center items-center'>
        <p className='mb-4'>An error occured. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </CardContent>
    </Card>
  );
};

export default ErrorFallback;
