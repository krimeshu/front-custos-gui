<template>
    <div class="container">
        <p v-for="item in list" :data-total="total">
            {{item}}
        </p>    
    </div>
</template>

<script>
export default {
    data: function () {
        return {
            list: ['hello world', '-- vue'],
            total: 123
        }
    }
}
</script>

<style lang="scss" scoped>
.container {
    background: #eff;
}
</style>